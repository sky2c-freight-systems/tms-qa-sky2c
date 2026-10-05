import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

/** GET /api/shipments/[fileNumber]/cargo — list this shipment's CargoContainers with nested items. */
export async function GET(_request: Request, { params }: { params: Promise<{ fileNumber: string }> }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { fileNumber } = await params;
  const shipment = await prisma.domesticWarehouseShipment.findUnique({ where: { fileNumber } });
  if (!shipment) {
    return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  }

  const containers = await prisma.cargoContainer.findMany({
    where: { shipmentId: shipment.id },
    include: { items: { orderBy: { id: "asc" } } },
    orderBy: { id: "asc" },
  });

  return NextResponse.json({ data: containers });
}

const createContainerSchema = z.object({
  containerNumber: z.string().nullish(),
  containerType: z.string().nullish(),
  seal1: z.string().nullish(),
  seal2: z.string().nullish(),
  seal3: z.string().nullish(),
  tareWeightLbs: z.number().nullish(),
  tareWeightKgs: z.number().nullish(),
  grossWeightLbs: z.number().nullish(),
  grossWeightKgs: z.number().nullish(),
  vgmWeight: z.number().nullish(),
});

/** POST /api/shipments/[fileNumber]/cargo — create a new CargoContainer under this shipment. */
export async function POST(request: Request, { params }: { params: Promise<{ fileNumber: string }> }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { fileNumber } = await params;
  const shipment = await prisma.domesticWarehouseShipment.findUnique({ where: { fileNumber } });
  if (!shipment) {
    return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = createContainerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  const container = await prisma.cargoContainer.create({
    data: {
      shipmentId: shipment.id,
      containerNumber: data.containerNumber ?? undefined,
      containerType: data.containerType ?? undefined,
      seal1: data.seal1 ?? undefined,
      seal2: data.seal2 ?? undefined,
      seal3: data.seal3 ?? undefined,
      tareWeightLbs: data.tareWeightLbs ?? undefined,
      tareWeightKgs: data.tareWeightKgs ?? undefined,
      grossWeightLbs: data.grossWeightLbs ?? undefined,
      grossWeightKgs: data.grossWeightKgs ?? undefined,
      vgmWeight: data.vgmWeight ?? undefined,
    },
    include: { items: true },
  });

  return NextResponse.json({ data: container }, { status: 201 });
}
