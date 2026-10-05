import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

/**
 * GET /api/shipments/[fileNumber]/delivery-orders
 * List all DeliveryOrder rows for the shipment (the simple pickup/delivery scheduling
 * entity — see prisma/schema.prisma DeliveryOrder).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ fileNumber: string }> }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { fileNumber } = await params;
  const shipment = await prisma.domesticWarehouseShipment.findUnique({ where: { fileNumber }, select: { id: true } });
  if (!shipment) return NextResponse.json({ error: "Shipment not found" }, { status: 404 });

  const items = await prisma.deliveryOrder.findMany({
    where: { shipmentId: shipment.id },
    orderBy: { scheduledDate: "asc" },
  });

  return NextResponse.json({ items });
}

const createDeliveryOrderSchema = z.object({
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

/** POST /api/shipments/[fileNumber]/delivery-orders — create a DeliveryOrder tied to this shipment. */
export async function POST(request: Request, { params }: { params: Promise<{ fileNumber: string }> }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { fileNumber } = await params;
  const shipment = await prisma.domesticWarehouseShipment.findUnique({ where: { fileNumber }, select: { id: true } });
  if (!shipment) return NextResponse.json({ error: "Shipment not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = createDeliveryOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  let scheduledDate: Date | null;
  try {
    scheduledDate = toDateOrNull(data.scheduledDate);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Invalid date" }, { status: 400 });
  }

  const deliveryOrder = await prisma.deliveryOrder.create({
    data: {
      shipmentId: shipment.id,
      scheduledDate: scheduledDate ?? undefined,
      scheduledWindow: data.scheduledWindow ?? undefined,
      driverName: data.driverName ?? undefined,
      truckNumber: data.truckNumber ?? undefined,
      contactPhone: data.contactPhone ?? undefined,
      notes: data.notes ?? undefined,
      status: data.status ?? undefined,
    },
  });

  return NextResponse.json({ data: deliveryOrder }, { status: 201 });
}
