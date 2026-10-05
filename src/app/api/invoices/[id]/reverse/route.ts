import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { recomputeShipmentBillableStatus } from "@/lib/billing";
import { generateInvoiceNumber } from "@/lib/numbering";
import { autoSyncInvoiceIfPosted } from "@/lib/qbo";

/**
 * POST /api/invoices/[id]/reverse — only available on a POSTED invoice. Creates a NEW
 * ArInvoice row with `reversalOfId` pointing at the original, status POSTED directly
 * (a reversal is itself a posted entry — e.g. a credit memo/negative charge).
 *
 * Sign convention: `totalChargeCents` is stored as the NEGATION of the original amount.
 * The spec's field list ("same customerId/totalChargeCents/dueDate/fileNumber/shipmentId")
 * is read as "same magnitude/fields", not literally the same signed value — a reversal
 * that duplicated the original amount verbatim would double-count on any dollar rollup
 * instead of canceling it out, which defeats the purpose of "reversing" a charge. Also
 * carries over chargeCode/currencyCode/prepaidOrCollect from the original (not explicitly
 * listed in the spec, but needed for the reversal row to be usable/syncable on its own)
 * and prefixes invoiceDescription so it's identifiable as a reversal in the UI.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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
      { error: `Invoice must be POSTED to reverse (current status: ${original.status})` },
      { status: 400 }
    );
  }

  const invoiceNo = await generateInvoiceNumber(original.fileNumber);

  const reversal = await prisma.arInvoice.create({
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
      totalChargeCents: -original.totalChargeCents,
      invoiceDescription: original.invoiceDescription
        ? `Reversal of: ${original.invoiceDescription}`
        : "Reversal",
      dueDate: original.dueDate,
      status: "POSTED",
      reversalOfId: original.id,
    },
  });

  if (reversal.shipmentId) {
    await recomputeShipmentBillableStatus(reversal.shipmentId);
  }

  const qboSyncError = await autoSyncInvoiceIfPosted(reversal.id, reversal.status);

  return NextResponse.json({ ...reversal, qboSyncError }, { status: 201 });
}
