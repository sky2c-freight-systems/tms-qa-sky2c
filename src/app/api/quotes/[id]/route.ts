import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { dollarsToCents } from "@/lib/money";
import { QUOTE_STATUS_VALUES } from "@/lib/quoteAccessorials";

const INCOTERMS_VALUES = ["CFR", "CIF", "CIP", "CPT", "DAP", "DAT", "DDP", "EXW", "FAS", "FCA", "FOB"] as const;

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** GET /api/quotes/[id] — single quote by id. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const quote = await prisma.domesticWarehouseQuote.findUnique({ where: { id } });
  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }
  return NextResponse.json(quote);
}

// Deliberately has NO `quoteNumber` field — PATCH must never be able to change the
// auto-generated business key. Zod strips unrecognized keys from the input by
// default, so a `quoteNumber` sent in the body is silently ignored.
const updateQuoteSchema = z.object({
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
  convertedToFileNumber: z.string().nullish(),

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

/** PATCH /api/quotes/[id] — partial update. `quoteNumber` can never be changed here. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.domesticWarehouseQuote.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateQuoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  let quotedAmountCents: number | null | undefined;
  try {
    if ("quotedAmount" in data) quotedAmountCents = dollarsToCents(data.quotedAmount ?? undefined);
  } catch {
    return NextResponse.json({ error: "Invalid quoted amount" }, { status: 400 });
  }

  const update: Prisma.DomesticWarehouseQuoteUpdateInput = {
    customerId: data.customerId,
    contactName: data.contactName,
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone,

    pickupLocation: data.pickupLocation,
    dischargeLocation: data.dischargeLocation,
    finalDestination: data.finalDestination,
    incoTerms: data.incoTerms,
    incoTermsLocation: data.incoTermsLocation,

    quotedBy: data.quotedBy,
    salesRep: data.salesRep,

    carrierId: data.carrierId,
    voyageVessel: data.voyageVessel,

    paymentTerms: data.paymentTerms,
    transitTime: data.transitTime,

    status: data.status,
    convertedToFileNumber: data.convertedToFileNumber,

    isHazardous: data.isHazardous,
    isHighValue: data.isHighValue,
    isOverweight: data.isOverweight,
    isOversize: data.isOversize,
    isBonded: data.isBonded,
    isPerishable: data.isPerishable,
    needsExtraMan: data.needsExtraMan,
    needsTempControl: data.needsTempControl,
    insidePickup: data.insidePickup,
    insideDelivery: data.insideDelivery,
    liftgatePickup: data.liftgatePickup,
    liftgateDelivery: data.liftgateDelivery,
    residentialPickup: data.residentialPickup,
    residentialDelivery: data.residentialDelivery,
    appointmentAtPickup: data.appointmentAtPickup,
    appointmentAtDelivery: data.appointmentAtDelivery,
  };
  if ("effectiveDate" in data) update.effectiveDate = parseDate(data.effectiveDate);
  if ("expirationDate" in data) update.expirationDate = parseDate(data.expirationDate);
  if (quotedAmountCents !== undefined) update.quotedAmountCents = quotedAmountCents;

  // Strip undefined keys so Prisma doesn't try to write `undefined` over existing values.
  for (const key of Object.keys(update) as (keyof typeof update)[]) {
    if (update[key] === undefined) delete update[key];
  }

  const quote = await prisma.domesticWarehouseQuote.update({ where: { id }, data: update });
  return NextResponse.json(quote);
}
