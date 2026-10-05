import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const updateLookupSchema = z.object({
  category: z.string().min(1).optional(),
  value: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

/** PATCH /api/lookups/[id] — partial update (also used to reactivate a soft-deleted row). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.lookupValue.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Lookup value not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateLookupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  const lookup = await prisma.lookupValue.update({
    where: { id },
    data: {
      category: data.category,
      value: data.value,
      label: data.label,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    },
  });

  return NextResponse.json(lookup);
}

/** DELETE /api/lookups/[id] — soft delete (sets isActive: false; rows are never hard-deleted). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.lookupValue.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Lookup value not found" }, { status: 404 });
  }

  const lookup = await prisma.lookupValue.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json(lookup);
}
