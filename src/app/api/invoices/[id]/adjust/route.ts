import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { dollarsToCents } from "@/lib/money";
import { recomputeShipmentBillableStatus } from "@/lib/billing";
import { generateInvoiceNumber } from "@/lib/numbering";
import { autoSyncInvoiceIfPosted } from "@/lib/qbo";

const adjustInvoiceSchema = z.object({
  totalCharge: z.union([z.string(), z.number()]),
  invoiceDescription: z.string().nullish(),
  status: z.enum(["IN_PROGRESS", "POSTED"]),
});

/**
 * POST /api/invoices/[id]/adjust — only available on a POSTED invoice. Creates a NEW
 * ArInvoice row with isAdjustment: true and adjustmentOfId pointing at the original.
 * customerId/fileNumber/shipmentId are copied from the original; totalChargeCents and
 * invoiceDescription come from the adjustment form; status is set per whichever
 * draft/post button the user clicked (same IN_PROGRESS/POSTED rule as a normal save).
 *
 * Also carries over chargeCode/currencyCode/prepaidOrCollect/dueDate/terms/
 * blPrintDescription from the original (not explicitly listed in the spec, but without
 * them the adjustment row would be missing basic fields it needs to be billable/syncable
 * on its own, e.g. chargeCode for QBO item resolution).
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const original = await prisma.arInvoice.findUnique({ where: { id } });
  if (!original) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  if (original.status !== "POSTED") {
    return NextResponse.json(
      { error: `Invoice must be POSTED to adjust (current status: ${original.status})` },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = adjustInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  let totalChargeCents: number;
  try {
    const cents = dollarsToCents(data.totalCharge);
    if (cents === null) throw new Error("totalCharge is required");
    totalChargeCents = cents;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid totalCharge" },
      { status: 400 }
    );
  }

  const invoiceNo = await generateInvoiceNumber(original.fileNumber);

  const adjustment = await prisma.arInvoice.create({
    data: {
      shipmentId: original.shipmentId,
      fileNumber: original.fileNumber,
      invoiceNo,
      customerId: original.customerId,
      chargeCode: original.chargeCode,
      divisionId: original.divisionId,
      currencyCode: original.currencyCode,
      exchangeRate: original.exchangeRate,
      prepaidOrCollect: original.prepaidOrCollect,
      totalChargeCents,
      invoiceDescription: data.invoiceDescription ?? undefined,
      blPrintDescription: original.blPrintDescription,
      dueDate: original.dueDate,
      terms: original.terms,
      status: data.status,
      isAdjustment: true,
      adjustmentOfId: original.id,
    },
  });

  if (adjustment.shipmentId) {
    await recomputeShipmentBillableStatus(adjustment.shipmentId);
  }

  const qboSyncError = await autoSyncInvoiceIfPosted(adjustment.id, adjustment.status);

  return NextResponse.json({ ...adjustment, qboSyncError }, { status: 201 });
}
