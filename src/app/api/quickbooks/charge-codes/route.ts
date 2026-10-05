import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const rows = await prisma.chargeCodeQboItemMap.findMany({
    orderBy: { chargeCode: "asc" },
  });
  return NextResponse.json({ rows });
}

const createSchema = z.object({
  chargeCode: z.string().min(1),
  qboItemId: z.string().min(1),
  qboItemName: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const row = await prisma.chargeCodeQboItemMap.create({
      data: {
        chargeCode: parsed.data.chargeCode,
        qboItemId: parsed.data.qboItemId,
        qboItemName: parsed.data.qboItemName,
        isActive: parsed.data.isActive ?? true,
      },
    });
    return NextResponse.json({ row }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create mapping (chargeCode may already exist)" },
      { status: 400 }
    );
  }
}
