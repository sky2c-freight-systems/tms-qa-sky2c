import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { MissingBolFieldsError, generatePickupBol, getMissingPickupBolFields, isDispatchShipment, listPickupBols } from "@/lib/pickupBol";

interface RouteParams {
  params: Promise<{ fileNumber: string }>;
}

/**
 * GET /api/shipments/[fileNumber]/bol — the shipment's generated Pickup BOLs, newest first,
 * plus `missing`: required BOL fields that are still empty.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const { fileNumber } = await params;
  const shipment = await prisma.domesticWarehouseShipment.findUnique({ where: { fileNumber } });
  if (!shipment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [data, missing] = await Promise.all([listPickupBols(shipment.id), getMissingPickupBolFields(shipment)]);
  return NextResponse.json({ data, missing });
}

/** POST /api/shipments/[fileNumber]/bol — "Generate BOL": renders and saves a new version. */
export async function POST(_request: Request, { params }: RouteParams) {
  let userId: string | undefined;
  try {
    userId = (await requireSession()).userId;
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const { fileNumber } = await params;
  const shipment = await prisma.domesticWarehouseShipment.findUnique({ where: { fileNumber } });
  if (!shipment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isDispatchShipment(shipment)) {
    return NextResponse.json({ error: "BOL generation is only for Dispatch shipments" }, { status: 400 });
  }
  try {
    const doc = await generatePickupBol(shipment, userId);
    return NextResponse.json({ data: doc }, { status: 201 });
  } catch (err) {
    if (err instanceof MissingBolFieldsError) {
      return NextResponse.json({ error: err.message, missing: err.missing }, { status: 422 });
    }
    console.error(`[bol] generation failed for ${fileNumber}:`, err);
    return NextResponse.json({ error: "Failed to generate BOL" }, { status: 500 });
  }
}
