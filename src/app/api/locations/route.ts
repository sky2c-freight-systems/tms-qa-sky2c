import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

/** GET /api/locations?q=&isActive=&page=&pageSize= — full list for the /locations admin page. */
export async function GET(request: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const isActiveParam = searchParams.get("isActive");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(500, Math.max(1, Number(searchParams.get("pageSize") ?? "100") || 100));

  const where: Prisma.LocationWhereInput = {};
  if (isActiveParam === "true") where.isActive = true;
  else if (isActiveParam === "false") where.isActive = false;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { state: { contains: q, mode: "insensitive" } },
      { code: { contains: q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.location.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.location.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}

const createLocationSchema = z.object({
  name: z.string().min(1),
  code: z.string().nullish(),
  city: z.string().nullish(),
  state: z.string().nullish(),
  country: z.string().nullish(),
});

/** POST /api/locations — create a new Location row. */
export async function POST(request: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createLocationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  const location = await prisma.location.create({
    data: {
      name: data.name.trim(),
      code: data.code ?? undefined,
      city: data.city ?? undefined,
      state: data.state ?? undefined,
      country: data.country ?? undefined,
      isActive: true,
    },
  });

  return NextResponse.json(location, { status: 201 });
}
