import { prisma } from "@/lib/prisma";
import type { BillableStatus, DomesticWarehouseShipment, ShipmentStatus } from "@prisma/client";
import { generateInvoiceNumber } from "@/lib/numbering";
import { autoSyncInvoiceIfPosted, updateSyncedInvoiceAmount } from "@/lib/qbo";
import { safeDollarsToCents } from "@/lib/zohoMapping";

/**
 * Default charge code for auto-created invoices. "TRK" (Trucking) matches this app's
 * business line (Domestic Warehouse/trucking shipments) and the QBO Item every invoice
 * line item actually posts to (see getDefaultQboItemId in qbo.ts, whose DEFAULT mapping
 * is configured as "Trucking") — a real, specific charge code can always be set
 * afterward via the billing page's Adjust flow.
 */
const AUTO_INVOICE_CHARGE_CODE = "TRK";

/**
 * Shipment statuses eligible for auto-invoice creation — "Picked up", "Delivered", "On
 * Hand" (see enumLabels.ts for the exact label spelling this maps to; NOT "On Hold",
 * a different status). A shipment reaching any ONE of these for the first time triggers
 * creation; the existing-invoice check in autoCreateInvoiceForShipment already makes
 * this a one-time event, so later moving between these statuses (or back and forth)
 * never creates a second invoice.
 */
const AUTO_INVOICE_ELIGIBLE_STATUSES: ReadonlySet<ShipmentStatus> = new Set(["PICKED_UP", "DELIVERED", "ON_HAND"]);

interface DryRunLineItem {
  description: string;
  amountCents: number;
}

// Matches dd/mm/yyyy-style dates (any of /, - as separator) ...
const SLASH_OR_DASH_DATE = /\b\d{1,4}[/-]\d{1,2}[/-]\d{1,4}\b/g;
// ... and "Sep 5, 2026" / "5th September 2026" style month-name dates, either order.
const MONTH_NAME = "jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec";
// The year, if present, must be whitespace-separated and exactly 4 digits — not merely
// \d{0,4} immediately following the day — otherwise e.g. "Sept 2026" (with no separator)
// misparses as month="Sept" + day="20" and leaves a stray "26" behind to be mistaken for
// the actual quote amount later. Confirmed against that exact failure case before fixing.
const MONTH_THEN_DAY_DATE = new RegExp(`\\b(?:${MONTH_NAME})[a-z]*\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+\\d{4})?\\b`, "gi");
const DAY_THEN_MONTH_DATE = new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${MONTH_NAME})[a-z]*\\.?(?:,?\\s+\\d{4})?\\b`, "gi");

/**
 * Parses the shipment's Dry Run field (mirrors Zoho's cf_multiple_quotes custom field —
 * an ops-entered, multiline history of quote figures, one per line) into one invoice
 * line item per line. Ops' convention is `<amount> - <description>` (e.g. "200 - Dry Run
 * vendor not ready"), occasionally with a date instead of/alongside the description
 * (e.g. "150 - 09/05/2026") — any date text is stripped before searching for the amount
 * so a date's digits are never mistaken for it, and the amount token is then stripped
 * back out of the ORIGINAL line (not the date-stripped copy, so date text elsewhere in
 * the line survives into the description) to get just the description text. A line with
 * no recognizable amount is skipped and logged rather than thrown — this is free-text ops
 * data, and malformed input must never block invoice creation.
 */
function parseDryRunLineItems(dryRun: string | null | undefined): DryRunLineItem[] {
  if (!dryRun) return [];

  const items: DryRunLineItem[] = [];
  for (const rawLine of dryRun.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const withoutDates = line
      .replace(SLASH_OR_DASH_DATE, " ")
      .replace(MONTH_THEN_DAY_DATE, " ")
      .replace(DAY_THEN_MONTH_DATE, " ");

    const match = withoutDates.match(/\$?\s*\d[\d,]*(?:\.\d{1,2})?/);
    const amountCents = match ? safeDollarsToCents(match[0].replace(/\$/g, "")) : null;
    if (!match || amountCents === null) {
      console.warn(`[billing] skipping unparsable Dry Run quote line: "${line}"`);
      continue;
    }

    // Strip the matched amount token plus a surrounding separator (dash/colon/comma) out
    // of the line to get the description alone; fall back to the full line if nothing
    // else was on it (e.g. a bare "200" with no trailing text).
    const description =
      line
        .replace(match[0], "")
        .replace(/^[\s\-:,]+|[\s\-:,]+$/g, "")
        .trim() || line;

    items.push({ description, amountCents });
  }
  return items;
}

/**
 * Combines the Dry Run quote-history line items with a final line item for the
 * shipment's own quote-amount total, per product decision: the invoice's grand total is
 * the SUM of every Dry Run figure plus the final quote amount, not just the quote amount
 * alone — see the Dry Run / cf_multiple_quotes feature discussion.
 */
function buildInvoiceLineItems(
  dryRun: string | null | undefined,
  totalChargesCents: number,
  finalDescription: string
): { lineItems: DryRunLineItem[]; totalChargeCents: number } {
  const lineItems: DryRunLineItem[] = [
    ...parseDryRunLineItems(dryRun),
    { description: finalDescription, amountCents: totalChargesCents },
  ];
  const totalChargeCents = lineItems.reduce((sum, li) => sum + li.amountCents, 0);
  return { lineItems, totalChargeCents };
}

function toLineItemCreateInput(lineItems: DryRunLineItem[]) {
  return lineItems.map((li, i) => ({ description: li.description, amountCents: li.amountCents, sortOrder: i }));
}

/**
 * Sum of every Dry Run quote-history figure plus the shipment's own quote amount — the
 * same grand total an invoice for this shipment shows (or will show once auto-created),
 * per buildInvoiceLineItems. Used by the shipments list's Quote Amount column so it
 * matches the invoice total instead of just the raw totalChargesCents field.
 */
export function computeShipmentTotalChargesCents(
  dryRun: string | null | undefined,
  totalChargesCents: number | null | undefined
): number | null {
  if (totalChargesCents == null) return null;
  const dryRunSum = parseDryRunLineItems(dryRun).reduce((sum, li) => sum + li.amountCents, 0);
  return dryRunSum + totalChargesCents;
}

/**
 * Shared rollup logic for DomesticWarehouseShipment.billableStatus. Call this after
 * ANY ArInvoice status change (create/post/cancel/delete/reverse/adjust) for a given
 * shipment so the shipment's rollup field stays in sync — this is the one place the
 * priority order lives, so billing routes don't each reimplement it slightly differently.
 *
 * Priority order, first match wins: POSTED > IN_PROGRESS > CANCELLED > DELETED.
 * A shipment with no invoices at all rolls up to NOT_APPLICABLE.
 */
const PRIORITY: BillableStatus[] = ["POSTED", "IN_PROGRESS", "CANCELLED", "DELETED"];

export async function recomputeShipmentBillableStatus(shipmentId: string): Promise<BillableStatus> {
  const invoices = await prisma.arInvoice.findMany({
    where: { shipmentId },
    select: { status: true },
  });

  const statuses = new Set(invoices.map((i) => i.status));
  const rollup = PRIORITY.find((status) => statuses.has(status)) ?? "NOT_APPLICABLE";

  await prisma.domesticWarehouseShipment.update({
    where: { id: shipmentId },
    data: { billableStatus: rollup },
  });

  return rollup;
}

/**
 * Auto-creates and posts an ArInvoice for a just-created shipment, reusing the
 * charge amount that's already known at creation time — the account/customer
 * shouldn't need to re-enter an amount the shipment already has. Called right
 * after a shipment is created, both from the manual "New Shipment" form and
 * from the Zoho ticket-created/ticket-updated webhooks (see
 * src/lib/zohoShipmentSync.ts).
 *
 * Deliberately conservative about when it fires: only if the shipment already
 * has a charge amount AND a resolved Account/customer AND has reached one of
 * AUTO_INVOICE_ELIGIBLE_STATUSES (Picked up / Delivered / On Hand) — a shipment
 * missing any of these (the common case for a plain manual shipment still in transit,
 * with billing to be filled in later) is left alone, going through the existing manual
 * billing form exactly as before. Never throws — a failure here must not
 * block shipment creation, which already succeeded; errors are logged and
 * swallowed like the QBO auto-sync it triggers.
 *
 * Line items: one per Dry Run quote-history line (shipment.dryRun, mirroring Zoho's
 * cf_multiple_quotes) plus a final line item for the quote-amount total — see
 * buildInvoiceLineItems. totalChargeCents is the SUM of all of them, not just the quote
 * amount alone.
 */
export async function autoCreateInvoiceForShipment(
  shipment: Pick<
    DomesticWarehouseShipment,
    "id" | "fileNumber" | "accountId" | "totalChargesCents" | "divisionId" | "dryRun" | "status"
  >,
  invoiceDescription?: string | null
): Promise<void> {
  if (!shipment.totalChargesCents || shipment.totalChargesCents <= 0) return;
  if (!shipment.accountId) return;
  if (!AUTO_INVOICE_ELIGIBLE_STATUSES.has(shipment.status)) return;

  try {
    const existing = await prisma.arInvoice.findFirst({ where: { shipmentId: shipment.id } });
    if (existing) return; // already has an invoice — don't create a second one

    const invoiceNo = await generateInvoiceNumber(shipment.fileNumber);
    const description = invoiceDescription?.trim() || "Auto-created from shipment";
    const { lineItems, totalChargeCents } = buildInvoiceLineItems(
      shipment.dryRun,
      shipment.totalChargesCents,
      description
    );

    const invoice = await prisma.arInvoice.create({
      data: {
        shipmentId: shipment.id,
        fileNumber: shipment.fileNumber,
        invoiceNo,
        customerId: shipment.accountId,
        chargeCode: AUTO_INVOICE_CHARGE_CODE,
        divisionId: shipment.divisionId ?? undefined,
        currencyCode: "USD",
        prepaidOrCollect: "PREPAID",
        totalChargeCents,
        invoiceDescription: description,
        status: "POSTED",
        invoiceDate: new Date(),
        lineItems: { create: toLineItemCreateInput(lineItems) },
      },
    });

    await recomputeShipmentBillableStatus(shipment.id);

    const qboSyncError = await autoSyncInvoiceIfPosted(invoice.id, invoice.status);
    if (qboSyncError) {
      console.error(`[billing] auto-created invoice ${invoice.id} failed to sync to QBO:`, qboSyncError);
    }
  } catch (err) {
    console.error(`[billing] failed to auto-create invoice for shipment ${shipment.id}:`, err);
  }
}

/**
 * Keeps an auto-created (or any) invoice's line items/amount in sync when the shipment's
 * charge amount and/or Dry Run quote history changes after the fact — e.g. a Zoho
 * ticket-updated webhook changing either custom field after the shipment (and its
 * invoice) already exist. Finds the shipment's single active (not cancelled/deleted)
 * invoice, if any, and re-derives its line items from scratch (delete + recreate — no
 * per-line diffing); pushes the same amount update to QBO if it was already synced
 * there. Never throws, same rationale as above.
 */
export async function syncInvoiceAmountToShipment(
  shipmentId: string,
  shipment: Pick<DomesticWarehouseShipment, "totalChargesCents" | "dryRun">
): Promise<void> {
  if (shipment.totalChargesCents == null || shipment.totalChargesCents <= 0) return;

  try {
    const invoice = await prisma.arInvoice.findFirst({
      where: { shipmentId, status: { in: ["IN_PROGRESS", "POSTED"] } },
      orderBy: { createdAt: "desc" },
    });
    if (!invoice) return;

    const { lineItems, totalChargeCents } = buildInvoiceLineItems(
      shipment.dryRun,
      shipment.totalChargesCents,
      invoice.invoiceDescription ?? "Auto-created from shipment"
    );
    if (invoice.totalChargeCents === totalChargeCents) return;

    await prisma.$transaction([
      prisma.arInvoiceLineItem.deleteMany({ where: { invoiceId: invoice.id } }),
      prisma.arInvoice.update({
        where: { id: invoice.id },
        data: { totalChargeCents, lineItems: { create: toLineItemCreateInput(lineItems) } },
      }),
    ]);

    if (invoice.status === "POSTED" && invoice.qboInvoiceId) {
      const qboSyncError = await updateSyncedInvoiceAmount(invoice.id);
      if (qboSyncError) {
        console.error(`[billing] failed to push amount update for invoice ${invoice.id} to QBO:`, qboSyncError);
      }
    }
  } catch (err) {
    console.error(`[billing] failed to sync invoice amount for shipment ${shipmentId}:`, err);
  }
}
