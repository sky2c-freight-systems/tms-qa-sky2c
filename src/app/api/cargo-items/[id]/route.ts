import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { dollarsToCents } from "@/lib/money";

const updateItemSchema = z.object({
  description: z.string().nullish(),
  numberOfPieces: z.number().int().nullish(),
  pieceType: z.string().nullish(),
  grossWeightLbs: z.number().nullish(),
  grossWeightKgs: z.number().nullish(),
  grossSizeCft: z.number().nullish(),
  grossSizeCbm: z.number().nullish(),
  declaredValue: z.union([z.string(), z.number()]).nullish(), // dollar amount, converted to cents below
  isVehicle: z.boolean().optional(),
  vehicleMake: z.string().nullish(),
  vehicleModel: z.string().nullish(),
  vehicleTitle: z.string().nullish(),
  vehicleState: z.string().nullish(),
});

/** PATCH /api/cargo-items/[id] — partial update of a CargoItem's fields. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.cargoItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  let declaredValueCents: number | null | undefined;
  try {
    if ("declaredValue" in data) declaredValueCents = dollarsToCents(data.declaredValue ?? undefined);
  } catch {
    return NextResponse.json({ error: "Invalid declared value amount" }, { status: 400 });
  }

  const update: Prisma.CargoItemUpdateInput = {
    description: data.description,
    numberOfPieces: data.numberOfPieces,
    pieceType: data.pieceType,
    grossWeightLbs: data.grossWeightLbs,
    grossWeightKgs: data.grossWeightKgs,
    grossSizeCft: data.grossSizeCft,
    grossSizeCbm: data.grossSizeCbm,
    isVehicle: data.isVehicle,
    vehicleMake: data.vehicleMake,
    vehicleModel: data.vehicleModel,
    vehicleTitle: data.vehicleTitle,
    vehicleState: data.vehicleState,
  };
  // Strip keys the client didn't send so Prisma doesn't overwrite existing values with undefined.
  for (const key of Object.keys(update) as (keyof typeof update)[]) {
    if (!(key in data)) delete update[key];
  }
  if (declaredValueCents !== undefined) update.declaredValueCents = declaredValueCents;

  const item = await prisma.cargoItem.update({ where: { id }, data: update });
  return NextResponse.json({ data: item });
}

/** DELETE /api/cargo-items/[id] — delete a single CargoItem. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.cargoItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  await prisma.cargoItem.delete({ where: { id } });
  return NextResponse.json({ data: { id } });
}
