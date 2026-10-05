import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { dollarsToCents } from "@/lib/money";
import { recomputeShipmentBillableStatus } from "@/lib/billing";
import { voidInvoiceInQbo } from "@/lib/qbo";

/** Parses an optional date-ish input (string | null | undefined) into a Date | null | undefined. */
function parseOptionalDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid date: ${value}`);
  return parsed;
}

const updateInvoiceSchema = z.object({
  customerId: z.string().min(1).optional(),
  chargeCode: z.string().nullish(),
  currencyCode: z.string().nullish(),
  exchangeRate: z.number().nullish(),
  prepaidOrCollect: z.string().nullish(),
  totalCharge: z.union([z.string(), z.number()]).optional(),
  invoiceDescription: z.string().nullish(),
  blPrintDescription: z.string().nullish(),
  invoiceDate: z.string().nullish(),
  dueDate: z.string().nullish(),
  terms: z.string().nullish(),
  invoiceNo: z.string().nullish(),
});

/**
 * PATCH /api/invoices/[id] — general field edits on a draft invoice. Only valid while
 * the invoice is still IN_PROGRESS — posting/cancelling/reversing/adjusting go through
 * their own dedicated endpoints, which are the only places status actually changes here.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.arInvoice.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  if (existing.status !== "IN_PROGRESS") {
    return NextResponse.json(
      { error: `Invoice cannot be edited while status is ${existing.status} — only IN_PROGRESS drafts can be edited` },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = updateInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  let totalChargeCents: number | null | undefined;
  let invoiceDate: Date | null | undefined;
  let dueDate: Date | null | undefined;
  try {
    if (data.totalCharge !== undefined) totalChargeCents = dollarsToCents(data.totalCharge);
    invoiceDate = parseOptionalDate(data.invoiceDate);
    dueDate = parseOptionalDate(data.dueDate);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid totalCharge or date" },
      { status: 400 }
    );
  }

  const update: Prisma.ArInvoiceUpdateInput = {
    customerId: data.customerId,
    chargeCode: data.chargeCode,
    currencyCode: data.currencyCode,
    exchangeRate: data.exchangeRate,
    prepaidOrCollect: data.prepaidOrCollect,
    invoiceDescription: data.invoiceDescription,
    blPrintDescription: data.blPrintDescription,
    terms: data.terms,
    invoiceNo: data.invoiceNo,
  };
  if (totalChargeCents !== undefined && totalChargeCents !== null) update.totalChargeCents = totalChargeCents;
  if (invoiceDate !== undefined) update.invoiceDate = invoiceDate;
  if (dueDate !== undefined) update.dueDate = dueDate;

  for (const key of Object.keys(update) as (keyof typeof update)[]) {
    if (update[key] === undefined) delete update[key];
  }

  const invoice = await prisma.arInvoice.update({ where: { id }, data: update });

  if (invoice.shipmentId) {
    await recomputeShipmentBillableStatus(invoice.shipmentId);
  }

  return NextResponse.json(invoice);
}

/**
 * DELETE /api/invoices/[id] — soft delete: voids the QBO-side invoice first (no-op if
 * never synced), then sets status DELETED. The row is never actually removed from Mongo.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.arInvoice.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  if (existing.status === "DELETED") {
    return NextResponse.json({ error: "Invoice is already deleted" }, { status: 400 });
  }

  await voidInvoiceInQbo(id);

  const invoice = await prisma.arInvoice.update({ where: { id }, data: { status: "DELETED" } });

  if (invoice.shipmentId) {
    await recomputeShipmentBillableStatus(invoice.shipmentId);
  }

  return NextResponse.json(invoice);
}
