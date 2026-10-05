import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { recomputeShipmentBillableStatus } from "@/lib/billing";

/**
 * POST /api/invoices/[id]/cancel — transitions an IN_PROGRESS invoice to CANCELLED.
 * Only valid on invoices that are NOT yet POSTED.
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
      { error: `Invoice must be IN_PROGRESS to cancel (current status: ${existing.status})` },
      { status: 400 }
    );
  }

  const invoice = await prisma.arInvoice.update({ where: { id }, data: { status: "CANCELLED" } });

  if (invoice.shipmentId) {
    await recomputeShipmentBillableStatus(invoice.shipmentId);
  }

  return NextResponse.json(invoice);
}
