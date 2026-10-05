import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { generateQuoteNumber } from "@/lib/numbering";
import { dollarsToCents } from "@/lib/money";
import { QUOTE_STATUS_VALUES } from "@/lib/quoteAccessorials";

const INCOTERMS_VALUES = ["CFR", "CIF", "CIP", "CPT", "DAP", "DAT", "DDP", "EXW", "FAS", "FCA", "FOB"] as const;

function isQuoteStatus(value: string | null): value is (typeof QUOTE_STATUS_VALUES)[number] {
  return !!value && (QUOTE_STATUS_VALUES as readonly string[]).includes(value);
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * GET /api/quotes?status=&q=&page=&pageSize=
 * Paginated list for the /quotes admin page. `customerId` is a plain scalar (not a
 * Prisma @relation — see schema header comment), so customer display names are
 * resolved here with a follow-up batch lookup rather than a Prisma `include`.
 */
export async function GET(request: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const status = isQuoteStatus(statusParam) ? statusParam : undefined;
  const q = searchParams.get("q")?.trim() || undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(200, Math.max(1, Number(searchParams.get("pageSize") ?? "50") || 50));

  const where: Prisma.DomesticWarehouseQuoteWhereInput = {};
  if (status) where.status = status;
  if (q) {
    const asNumber = Number(q);
    where.OR = [
      { contactName: { contains: q, mode: "insensitive" } },
      { contactEmail: { contains: q, mode: "insensitive" } },
      { pickupLocation: { contains: q, mode: "insensitive" } },
      { finalDestination: { contains: q, mode: "insensitive" } },
      ...(Number.isFinite(asNumber) && q !== "" ? [{ quoteNumber: asNumber }] : []),
    ];
  }

  const [items, total] = await Promise.all([
    prisma.domesticWarehouseQuote.findMany({
      where,
      orderBy: { quoteNumber: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.domesticWarehouseQuote.count({ where }),
  ]);

  const customerIds = [...new Set(items.map((i) => i.customerId).filter((id): id is string => !!id))];
  const customers = customerIds.length
    ? await prisma.client.findMany({ where: { id: { in: customerIds } }, select: { id: true, name: true } })
    : [];
  const customerNameById = new Map(customers.map((c) => [c.id, c.name]));

  const itemsWithCustomer = items.map((quote) => ({
    ...quote,
    customerName: quote.customerId ? (customerNameById.get(quote.customerId) ?? null) : null,
  }));

  return NextResponse.json({ items: itemsWithCustomer, total, page, pageSize });
}

const createQuoteSchema = z.object({
  customerId: z.string().nullish(),
  contactName: z.string().nullish(),
  contactEmail: z.string().nullish(),
  contactPhone: z.string().nullish(),

  pickupLocation: z.string().nullish(),
  dischargeLocation: z.string().nullish(),
  finalDestination: z.string().nullish(),
  incoTerms: z.enum(INCOTERMS_VALUES).nullish(),
  incoTermsLocation: z.string().nullish(),

  effectiveDate: z.string().nullish(),
  expirationDate: z.string().nullish(),
  quotedBy: z.string().nullish(),
  salesRep: z.string().nullish(),

  carrierId: z.string().nullish(),
  voyageVessel: z.string().nullish(),

  paymentTerms: z.string().nullish(),
  transitTime: z.string().nullish(),

  quotedAmount: z.union([z.string(), z.number()]).nullish(),
  status: z.enum(QUOTE_STATUS_VALUES).optional(),

  isHazardous: z.boolean().optional(),
  isHighValue: z.boolean().optional(),
  isOverweight: z.boolean().optional(),
  isOversize: z.boolean().optional(),
  isBonded: z.boolean().optional(),
  isPerishable: z.boolean().optional(),
  needsExtraMan: z.boolean().optional(),
  needsTempControl: z.boolean().optional(),
  insidePickup: z.boolean().optional(),
  insideDelivery: z.boolean().optional(),
  liftgatePickup: z.boolean().optional(),
  liftgateDelivery: z.boolean().optional(),
  residentialPickup: z.boolean().optional(),
  residentialDelivery: z.boolean().optional(),
  appointmentAtPickup: z.boolean().optional(),
  appointmentAtDelivery: z.boolean().optional(),
});

/**
 * POST /api/quotes — create. Always generates a fresh `quoteNumber` via the shared
 * numbering service and defaults `status` to "DRAFT" regardless of what's posted.
 */
export async function POST(request: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createQuoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  let quotedAmountCents: number | null;
  try {
    quotedAmountCents = dollarsToCents(data.quotedAmount ?? undefined);
  } catch {
    return NextResponse.json({ error: "Invalid quoted amount" }, { status: 400 });
  }

  const quoteNumber = await generateQuoteNumber();

  const quote = await prisma.domesticWarehouseQuote.create({
    data: {
      quoteNumber,
      customerId: data.customerId ?? undefined,
      contactName: data.contactName ?? undefined,
      contactEmail: data.contactEmail ?? undefined,
      contactPhone: data.contactPhone ?? undefined,

      pickupLocation: data.pickupLocation ?? undefined,
      dischargeLocation: data.dischargeLocation ?? undefined,
      finalDestination: data.finalDestination ?? undefined,
      incoTerms: data.incoTerms ?? undefined,
      incoTermsLocation: data.incoTermsLocation ?? undefined,

      effectiveDate: parseDate(data.effectiveDate) ?? undefined,
      expirationDate: parseDate(data.expirationDate) ?? undefined,
      quotedBy: data.quotedBy ?? undefined,
      salesRep: data.salesRep ?? undefined,

      carrierId: data.carrierId ?? undefined,
      voyageVessel: data.voyageVessel ?? undefined,

      paymentTerms: data.paymentTerms ?? undefined,
      transitTime: data.transitTime ?? undefined,

      isHazardous: data.isHazardous ?? undefined,
      isHighValue: data.isHighValue ?? undefined,
      isOverweight: data.isOverweight ?? undefined,
      isOversize: data.isOversize ?? undefined,
      isBonded: data.isBonded ?? undefined,
      isPerishable: data.isPerishable ?? undefined,
      needsExtraMan: data.needsExtraMan ?? undefined,
      needsTempControl: data.needsTempControl ?? undefined,
      insidePickup: data.insidePickup ?? undefined,
      insideDelivery: data.insideDelivery ?? undefined,
      liftgatePickup: data.liftgatePickup ?? undefined,
      liftgateDelivery: data.liftgateDelivery ?? undefined,
      residentialPickup: data.residentialPickup ?? undefined,
      residentialDelivery: data.residentialDelivery ?? undefined,
      appointmentAtPickup: data.appointmentAtPickup ?? undefined,
      appointmentAtDelivery: data.appointmentAtDelivery ?? undefined,

      quotedAmountCents: quotedAmountCents ?? undefined,
      status: "DRAFT",
    },
  });

  return NextResponse.json(quote, { status: 201 });
}
