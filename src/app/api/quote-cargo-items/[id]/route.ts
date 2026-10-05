import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { dollarsToCents } from "@/lib/money";

const updateCargoItemSchema = z.object({
  description: z.string().nullish(),
  numberOfPieces: z.number().int().nullish(),
  pieceType: z.string().nullish(),
  grossWeightLbs: z.number().nullish(),
  grossSizeCft: z.number().nullish(),
  declaredValue: z.union([z.string(), z.number()]).nullish(),
});

/** PATCH /api/quote-cargo-items/[id] — update a single QuoteCargoItem row. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.quoteCargoItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Cargo item not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateCargoItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  let declaredValueCents: number | null | undefined;
  try {
    if ("declaredValue" in data) declaredValueCents = dollarsToCents(data.declaredValue ?? undefined);
  } catch {
    return NextResponse.json({ error: "Invalid declared value" }, { status: 400 });
  }

  const update: Prisma.QuoteCargoItemUpdateInput = {
    description: data.description,
    numberOfPieces: data.numberOfPieces,
    pieceType: data.pieceType,
    grossWeightLbs: data.grossWeightLbs,
    grossSizeCft: data.grossSizeCft,
  };
  if (declaredValueCents !== undefined) update.declaredValueCents = declaredValueCents;

  for (const key of Object.keys(update) as (keyof typeof update)[]) {
    if (update[key] === undefined) delete update[key];
  }

  const item = await prisma.quoteCargoItem.update({ where: { id }, data: update });
  return NextResponse.json(item);
}

/** DELETE /api/quote-cargo-items/[id] — remove a single QuoteCargoItem row. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.quoteCargoItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Cargo item not found" }, { status: 404 });
  }

  await prisma.quoteCargoItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
