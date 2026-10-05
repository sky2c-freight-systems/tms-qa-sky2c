import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { dollarsToCents } from "@/lib/money";

/** GET /api/quotes/[id]/cargo-items — all QuoteCargoItem rows for one quote. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const quote = await prisma.domesticWarehouseQuote.findUnique({ where: { id }, select: { id: true } });
  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const items = await prisma.quoteCargoItem.findMany({ where: { quoteId: id } });
  return NextResponse.json(items);
}

const createCargoItemSchema = z.object({
  description: z.string().nullish(),
  numberOfPieces: z.number().int().nullish(),
  pieceType: z.string().nullish(),
  grossWeightLbs: z.number().nullish(),
  grossSizeCft: z.number().nullish(),
  declaredValue: z.union([z.string(), z.number()]).nullish(),
});

/** POST /api/quotes/[id]/cargo-items — create a new QuoteCargoItem row nested under the quote. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const quote = await prisma.domesticWarehouseQuote.findUnique({ where: { id }, select: { id: true } });
  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createCargoItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  let declaredValueCents: number | null;
  try {
    declaredValueCents = dollarsToCents(data.declaredValue ?? undefined);
  } catch {
    return NextResponse.json({ error: "Invalid declared value" }, { status: 400 });
  }

  const item = await prisma.quoteCargoItem.create({
    data: {
      quoteId: id,
      description: data.description ?? undefined,
      numberOfPieces: data.numberOfPieces ?? undefined,
      pieceType: data.pieceType ?? undefined,
      grossWeightLbs: data.grossWeightLbs ?? undefined,
      grossSizeCft: data.grossSizeCft ?? undefined,
      declaredValueCents: declaredValueCents ?? undefined,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
