import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const patchDeliveryOrderSchema = z.object({
  scheduledDate: z.string().nullish(),
  scheduledWindow: z.string().nullish(),
  driverName: z.string().nullish(),
  truckNumber: z.string().nullish(),
  contactPhone: z.string().nullish(),
  notes: z.string().nullish(),
  status: z.string().nullish(),
});

function toDateOrNull(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date value: ${value}`);
  return d;
}

/**
 * PATCH /api/shipments/[fileNumber]/delivery-orders/[id] — partial update. Verifies the
 * DeliveryOrder actually belongs to the shipment named by `fileNumber` (not just any id)
 * before updating.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ fileNumber: string; id: string }> }
) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { fileNumber, id } = await params;
  const shipment = await prisma.domesticWarehouseShipment.findUnique({ where: { fileNumber }, select: { id: true } });
  if (!shipment) return NextResponse.json({ error: "Shipment not found" }, { status: 404 });

  const existing = await prisma.deliveryOrder.findUnique({ where: { id } });
  if (!existing || existing.shipmentId !== shipment.id) {
    return NextResponse.json({ error: "Delivery order not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchDeliveryOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  const update: Prisma.DeliveryOrderUpdateInput = {};
  if (data.scheduledWindow !== undefined) update.scheduledWindow = data.scheduledWindow;
  if (data.driverName !== undefined) update.driverName = data.driverName;
  if (data.truckNumber !== undefined) update.truckNumber = data.truckNumber;
  if (data.contactPhone !== undefined) update.contactPhone = data.contactPhone;
  if (data.notes !== undefined) update.notes = data.notes;
  if (data.status !== undefined && data.status !== null) update.status = data.status;

  try {
    if (data.scheduledDate !== undefined) update.scheduledDate = toDateOrNull(data.scheduledDate);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Invalid date" }, { status: 400 });
  }

  const deliveryOrder = await prisma.deliveryOrder.update({ where: { id }, data: update });
  return NextResponse.json({ data: deliveryOrder });
}
