import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

/** GET /api/lookups?category=&includeInactive= — list LookupValue rows, optionally scoped to a category. */
export async function GET(request: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? undefined;
  const includeInactive = searchParams.get("includeInactive") === "true";

  const where: Prisma.LookupValueWhereInput = {};
  if (category) where.category = category;
  if (!includeInactive) where.isActive = true;

  const values = await prisma.lookupValue.findMany({
    where,
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { label: "asc" }],
  });

  return NextResponse.json(values);
}

const createLookupSchema = z.object({
  category: z.string().min(1),
  value: z.string().min(1),
  label: z.string().min(1),
  sortOrder: z.number().int().optional(),
});

/** POST /api/lookups — create a new LookupValue row. */
export async function POST(request: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createLookupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.lookupValue.findUnique({
    where: { category_value: { category: data.category, value: data.value } },
  });
  if (existing) {
    return NextResponse.json(
      { error: `A "${data.category}" lookup with value "${data.value}" already exists` },
      { status: 409 }
    );
  }

  const lookup = await prisma.lookupValue.create({
    data: {
      category: data.category,
      value: data.value,
      label: data.label,
      sortOrder: data.sortOrder ?? 0,
      isActive: true,
    },
  });

  return NextResponse.json(lookup, { status: 201 });
}
