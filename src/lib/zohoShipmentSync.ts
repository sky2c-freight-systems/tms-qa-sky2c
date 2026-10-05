import { prisma } from "@/lib/prisma";
import { findOrCreateClient } from "@/lib/clientService";
import { generateFileNumber } from "@/lib/numbering";
import { buildTruncatedDraft, resolveTicketMeta } from "@/lib/zohoMapping";
import { pushFileNumberToZohoTicket } from "@/lib/zohoDeskApi";
import { autoCreateInvoiceForShipment } from "@/lib/billing";
import { mapZohoStatusToShipmentStatus } from "@/lib/zohoStatusMap";
import { recordTrackingEvent } from "@/lib/tracking";
import { sendOrderConfirmationEmail } from "@/lib/orderConfirmationEmail";
import { notifyZohoTicketOfFileGenerated } from "@/lib/zohoOrderNotification";

/**
 * Division/line-of-business constants used both when auto-creating shipments from
 * Zoho tickets AND as the default for shipments created via the UI (see
 * src/app/api/shipments/route.ts). fileNumber is generated as
 * `${divisionId}${busLine}${10000+n}` (see src/lib/numbering.ts) — divisionId=99,
 * busLine=65 means every new Domestic Warehouse file number starts `9965...`.
 * Existing shipments already numbered `2065...` are untouched — this only changes
 * the prefix used for numbers generated from here on.
 */
export const ZOHO_DIVISION_ID = 99;
export const ZOHO_BUS_LINE = 65;

export interface CreateShipmentResult {
  fileNumber: string;
  accountName?: string;
  origin?: string;
  destination?: string;
  carrierName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

/** Sentinel written to ZohoSync.fileNumber while a shipment creation is in flight for a
 * ticket, so a concurrent webhook call can tell "already being created" apart from "not
 * created yet" — see claimShipmentCreationForTicket. Never a real file number (numeric),
 * so it's unambiguous even if a caller reads it mid-flight.
 *
 * IMPORTANT: this is a truthy string, so any caller checking "is a shipment linked yet"
 * must use isPendingCreationClaim(syncRow.fileNumber), NOT a plain `!syncRow.fileNumber`
 * check — the latter would treat a claim-in-progress as "no link yet", fall through to
 * looking up a shipment by this literal sentinel string (which obviously finds none),
 * and wrongly conclude "the shipment was deleted, recreate it" — recreating a duplicate
 * exactly as if the claim had never been checked at all.
 */
const CLAIM_SENTINEL = "__CREATING__";

/** True if `fileNumber` is the in-flight claim sentinel rather than a real file number
 * or null/unset — see CLAIM_SENTINEL. */
export function isPendingCreationClaim(fileNumber: string | null | undefined): boolean {
  return fileNumber === CLAIM_SENTINEL;
}

/**
 * Atomically claims the right to create the shipment for a Zoho ticket, so a
 * ticket-created webhook racing a near-simultaneous ticket-updated webhook for
 * the same brand-new ticket (both can see "no fileNumber yet" if they read at
 * the same moment) can't both create a shipment. MongoDB's single-document
 * updateMany is atomic: only the first caller's update actually matches (the
 * WHERE clause requires fileNumber still unset), so at most one caller ever
 * gets `true` back for a given ticket.
 *
 * Must be called AFTER the ZohoSync row is guaranteed to exist (both webhook
 * handlers upsert it first for audit purposes) but BEFORE calling
 * createShipmentForTicket. Returns false if another call already claimed it
 * (or a real shipment already exists) — the caller should skip creating.
 */
export async function claimShipmentCreationForTicket(zohoTicketId: string): Promise<boolean> {
  const result = await prisma.zohoSync.updateMany({
    where: {
      zohoTicketId,
      OR: [{ fileNumber: null }, { fileNumber: { isSet: false } }],
    },
    data: { fileNumber: CLAIM_SENTINEL },
  });
  return result.count > 0;
}

/**
 * Same idea as claimShipmentCreationForTicket, but for the "ZohoSync points at a
 * fileNumber whose shipment was deleted" recovery path — that case starts from a
 * real (stale) fileNumber, not null/unset, so the claim there is an optimistic
 * concurrency check instead: only succeeds if the row's fileNumber is STILL
 * exactly `staleFileNumber` at the moment of the update. Two concurrent requests
 * both seeing the same stale value can't both win.
 */
export async function claimRecreationForTicket(
  zohoTicketId: string,
  staleFileNumber: string
): Promise<boolean> {
  const result = await prisma.zohoSync.updateMany({
    where: { zohoTicketId, fileNumber: staleFileNumber },
    data: { fileNumber: CLAIM_SENTINEL },
  });
  return result.count > 0;
}

/**
 * Maps a Zoho ticket payload to a DomesticWarehouseShipment, resolving/creating the
 * Account, Shipper, Consignee, and Carrier clients along the way, then inserts the
 * shipment row. Shared by the ticket-created webhook (always) and the ticket-updated
 * webhook (when it discovers no shipment exists yet for a ticket it's seeing an update
 * for — treated like a first-time create per the integration spec).
 *
 * Per the shipper/consignee fallback rule (and the clientService.ts "don't double-print
 * the address" bug fix), Shipper/Consignee are resolved by name only — never with an
 * `address` param — since this ticket layout has no separate address field for either
 * role; when their name resolves to the Origin/Destination text via fallback, that text
 * must not ALSO be stored as street address.
 *
 * After the shipment is created, the generated fileNumber is pushed back onto the
 * originating ticket's "Reference Number" field in Zoho Desk — best-effort: a failure
 * there is logged and swallowed, never allowed to fail shipment creation (the shipment
 * row and ZohoSync audit trail are the source of truth; the push-back is a courtesy).
 */
export async function createShipmentForTicket(
  payload: unknown,
  zohoTicketId: string
): Promise<CreateShipmentResult> {
  const draft = buildTruncatedDraft(payload);

  const [account, shipper, consignee, carrier] = await Promise.all([
    draft.accountName
      ? findOrCreateClient({
          name: draft.accountName,
          role: "ACCOUNT",
          emailAddress: draft.contactEmail,
          telephone: draft.contactPhone,
        })
      : Promise.resolve(null),
    draft.shipperName ? findOrCreateClient({ name: draft.shipperName, role: "SHIPPER" }) : Promise.resolve(null),
    draft.consigneeName ? findOrCreateClient({ name: draft.consigneeName, role: "CONSIGNEE" }) : Promise.resolve(null),
    draft.carrierName ? findOrCreateClient({ name: draft.carrierName, role: "CARRIER" }) : Promise.resolve(null),
  ]);

  const meta = resolveTicketMeta(payload);
  const ticketSubject = meta.subject || undefined;
  const status = mapZohoStatusToShipmentStatus(meta.status) ?? "OPEN";

  const fileNumber = await generateFileNumber(ZOHO_DIVISION_ID, ZOHO_BUS_LINE);

  const shipment = await prisma.domesticWarehouseShipment.create({
    data: {
      fileNumber,
      divisionId: ZOHO_DIVISION_ID,
      busLine: ZOHO_BUS_LINE,
      status,
      domesticType: draft.domesticType,
      accountId: account?.id,
      shipperId: shipper?.id,
      consigneeId: consignee?.id,
      carrierId: carrier?.id,
      origin: draft.origin,
      destination: draft.destination,
      proNumber: draft.proNumber,
      bolNumber: draft.bolNumber,
      cargoDescription: draft.cargoDescription,
      dryRun: draft.dryRun,
      totalChargesCents: draft.totalChargesCents ?? undefined,
      shipAt: draft.shipAt ?? undefined,
    },
  });

  // Seed the timeline with the shipment's opening status so the tracking page has a
  // first milestone rather than appearing empty until someone changes the status.
  await recordTrackingEvent({
    shipmentId: shipment.id,
    fileNumber,
    status,
    source: "ZOHO",
    note: ticketSubject,
    location: draft.origin ?? null,
  });

  await autoCreateInvoiceForShipment(shipment, ticketSubject);

  await sendOrderConfirmationEmail(shipment, { contactEmail: draft.contactEmail });
  await notifyZohoTicketOfFileGenerated(zohoTicketId, shipment.accountId, fileNumber);

  try {
    await pushFileNumberToZohoTicket(zohoTicketId, fileNumber);
  } catch (err) {
    console.error(`[zoho] failed to push fileNumber back to ticket ${zohoTicketId}:`, err);
  }

  return {
    fileNumber,
    accountName: draft.accountName,
    origin: draft.origin,
    destination: draft.destination,
    carrierName: draft.carrierName,
    contactEmail: draft.contactEmail,
    contactPhone: draft.contactPhone,
  };
}
