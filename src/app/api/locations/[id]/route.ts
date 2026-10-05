import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

/** GET /api/locations/[id] — single location by id. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const location = await prisma.location.findUnique({ where: { id } });
  if (!location) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }
  return NextResponse.json(location);
}

const updateLocationSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().nullish(),
  city: z.string().nullish(),
  state: z.string().nullish(),
  country: z.string().nullish(),
  isActive: z.boolean().optional(),
});

/** PATCH /api/locations/[id] — partial update. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.location.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateLocationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  const location = await prisma.location.update({
    where: { id },
    data: {
      name: data.name,
      code: data.code,
      city: data.city,
      state: data.state,
      country: data.country,
      isActive: data.isActive,
    },
  });

  return NextResponse.json(location);
}
