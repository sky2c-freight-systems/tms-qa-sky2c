import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const updateContainerSchema = z.object({
  containerNumber: z.string().nullish(),
  containerType: z.string().nullish(),
  seal1: z.string().nullish(),
  seal2: z.string().nullish(),
  seal3: z.string().nullish(),
  tareWeightLbs: z.number().nullish(),
  tareWeightKgs: z.number().nullish(),
  grossWeightLbs: z.number().nullish(),
  grossWeightKgs: z.number().nullish(),
  vgmWeight: z.number().nullish(),
});

/** PATCH /api/cargo-containers/[id] — partial update of a CargoContainer's fields. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.cargoContainer.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Container not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateContainerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  const update: Prisma.CargoContainerUpdateInput = {
    containerNumber: data.containerNumber,
    containerType: data.containerType,
    seal1: data.seal1,
    seal2: data.seal2,
    seal3: data.seal3,
    tareWeightLbs: data.tareWeightLbs,
    tareWeightKgs: data.tareWeightKgs,
    grossWeightLbs: data.grossWeightLbs,
    grossWeightKgs: data.grossWeightKgs,
    vgmWeight: data.vgmWeight,
  };
  // Strip keys the client didn't send so Prisma doesn't overwrite existing values with undefined.
  for (const key of Object.keys(update) as (keyof typeof update)[]) {
    if (!(key in data)) delete update[key];
  }

  const container = await prisma.cargoContainer.update({
    where: { id },
    data: update,
    include: { items: { orderBy: { id: "asc" } } },
  });

  return NextResponse.json({ data: container });
}

/**
 * DELETE /api/cargo-containers/[id] — delete a CargoContainer.
 *
 * The schema declares `CargoItem.container` with `onDelete: Cascade`, which Prisma emulates
 * client-side on MongoDB (there are no real FK constraints in Mongo, so Prisma issues the
 * child deletes itself before the parent delete when using its relation-aware `delete()`).
 * To not depend on that emulation being wired correctly, we delete the child CargoItems
 * explicitly first inside a single $transaction, then delete the container — this is
 * correct and safe whether or not Prisma's cascade emulation also fires.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.cargoContainer.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Container not found" }, { status: 404 });
  }

  const [{ count: deletedItemCount }] = await prisma.$transaction([
    prisma.cargoItem.deleteMany({ where: { containerId: id } }),
    prisma.cargoContainer.delete({ where: { id } }),
  ]);

  return NextResponse.json({ data: { id, deletedItemCount } });
}
