import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import type { InvoiceStatus, Prisma } from "@prisma/client";

/**
 * GET /api/invoices — global list of ArInvoice rows across every shipment, for the
 * top-level "Invoices" nav page. Each shipment already has its own scoped list at
 * /shipments/[fileNumber]/billing (which owns the actual lifecycle actions); this
 * endpoint is read-only and just resolves customer names for display.
 */
export async function GET(request: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(searchParams.get("pageSize")) || 50));

  const where: Prisma.ArInvoiceWhereInput = {};
  if (status) where.status = status as InvoiceStatus;
  if (q) {
    where.OR = [
      { fileNumber: { contains: q, mode: "insensitive" } },
      { invoiceNo: { contains: q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.arInvoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.arInvoice.count({ where }),
  ]);

  const customerIds = [...new Set(items.map((i) => i.customerId))];
  const customers = customerIds.length
    ? await prisma.client.findMany({ where: { id: { in: customerIds } }, select: { id: true, name: true } })
    : [];
  const nameById = new Map(customers.map((c) => [c.id, c.name]));

  const data = items.map((invoice) => ({
    ...invoice,
    customerName: nameById.get(invoice.customerId) ?? null,
  }));

  return NextResponse.json({ items: data, total, page, pageSize });
}
