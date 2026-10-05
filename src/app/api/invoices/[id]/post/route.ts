import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { recomputeShipmentBillableStatus } from "@/lib/billing";
import { generateInvoiceNumber } from "@/lib/numbering";
import { autoSyncInvoiceIfPosted } from "@/lib/qbo";

/**
 * POST /api/invoices/[id]/post — transitions an IN_PROGRESS invoice to POSTED, then
 * auto-syncs it to QuickBooks (no separate manual "Sync Now" needed for this invoice).
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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
      { error: `Invoice must be IN_PROGRESS to post (current status: ${existing.status})` },
      { status: 400 }
    );
  }

  // Backfills invoiceNo for invoices created before auto-numbering existed.
  const invoiceNo = existing.invoiceNo ?? (await generateInvoiceNumber(existing.fileNumber));

  const invoice = await prisma.arInvoice.update({
    where: { id },
    data: { status: "POSTED", invoiceNo },
  });

  if (invoice.shipmentId) {
    await recomputeShipmentBillableStatus(invoice.shipmentId);
  }

  const qboSyncError = await autoSyncInvoiceIfPosted(invoice.id, invoice.status);

  return NextResponse.json({ ...invoice, qboSyncError });
}
