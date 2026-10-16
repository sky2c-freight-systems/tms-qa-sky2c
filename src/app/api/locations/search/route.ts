import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { escapeRegex } from "@/lib/mongoText";

/**
 * GET /api/locations/search?q=&limit=
 * Thin type-ahead lookup used by <LocationLookupField>. Case-insensitive contains
 * match against name/city/state. Returns { id, name }[].
 */
export async function GET(request: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(100, Math.max(1, Number(limitParam) || 25)) : 25;

  const where: Prisma.LocationWhereInput = { isActive: true };
  if (q) {
    where.OR = [
      { name: { contains: escapeRegex(q), mode: "insensitive" } },
      { city: { contains: escapeRegex(q), mode: "insensitive" } },
      { state: { contains: escapeRegex(q), mode: "insensitive" } },
    ];
  }

  const locations = await prisma.location.findMany({
    where,
    orderBy: { name: "asc" },
    take: limit,
  });

  return NextResponse.json(locations.map((l) => ({ id: l.id, name: l.name })));
}
