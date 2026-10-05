import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { dollarsToCents } from "@/lib/money";

const createItemSchema = z.object({
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

/** POST /api/cargo-containers/[id]/items — create a new CargoItem under this container. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const container = await prisma.cargoContainer.findUnique({ where: { id } });
  if (!container) {
    return NextResponse.json({ error: "Container not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  let declaredValueCents: number | null;
  try {
    declaredValueCents = dollarsToCents(data.declaredValue ?? undefined);
  } catch {
    return NextResponse.json({ error: "Invalid declared value amount" }, { status: 400 });
  }

  const item = await prisma.cargoItem.create({
    data: {
      containerId: id,
      description: data.description ?? undefined,
      numberOfPieces: data.numberOfPieces ?? undefined,
      pieceType: data.pieceType ?? undefined,
      grossWeightLbs: data.grossWeightLbs ?? undefined,
      grossWeightKgs: data.grossWeightKgs ?? undefined,
      grossSizeCft: data.grossSizeCft ?? undefined,
      grossSizeCbm: data.grossSizeCbm ?? undefined,
      declaredValueCents: declaredValueCents ?? undefined,
      isVehicle: data.isVehicle ?? false,
      vehicleMake: data.vehicleMake ?? undefined,
      vehicleModel: data.vehicleModel ?? undefined,
      vehicleTitle: data.vehicleTitle ?? undefined,
      vehicleState: data.vehicleState ?? undefined,
    },
  });

  return NextResponse.json({ data: item }, { status: 201 });
}
