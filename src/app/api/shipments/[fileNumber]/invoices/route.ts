import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { dollarsToCents } from "@/lib/money";
import { recomputeShipmentBillableStatus } from "@/lib/billing";
import { generateInvoiceNumber } from "@/lib/numbering";
import { autoSyncInvoiceIfPosted } from "@/lib/qbo";

/** Parses an optional date-ish input (string | null | undefined) into a Date | null | undefined. */
function parseOptionalDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid date: ${value}`);
  return parsed;
}

/** GET /api/shipments/[fileNumber]/invoices — list ArInvoice rows for this shipment, newest first. */
export async function GET(_request: Request, { params }: { params: Promise<{ fileNumber: string }> }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { fileNumber } = await params;
  const invoices = await prisma.arInvoice.findMany({
    where: { fileNumber },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items: invoices });
}

const createInvoiceSchema = z.object({
  customerId: z.string().min(1),
  chargeCode: z.string().nullish(),
  currencyCode: z.string().nullish(),
  exchangeRate: z.number().nullish(),
  prepaidOrCollect: z.string().nullish(),
  totalCharge: z.union([z.string(), z.number()]),
  invoiceDescription: z.string().nullish(),
  blPrintDescription: z.string().nullish(),
  invoiceDate: z.string().nullish(),
  dueDate: z.string().nullish(),
  terms: z.string().nullish(),
  status: z.enum(["IN_PROGRESS", "POSTED"]),
});

/**
 * POST /api/shipments/[fileNumber]/invoices — create a new ArInvoice for this shipment.
 * `status` is chosen by which submit button the UI used ("Save as Draft" -> IN_PROGRESS,
 * "Save & Post" -> POSTED directly, skipping IN_PROGRESS per spec).
 */
export async function POST(request: Request, { params }: { params: Promise<{ fileNumber: string }> }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { fileNumber } = await params;
  const shipment = await prisma.domesticWarehouseShipment.findUnique({ where: { fileNumber } });
  if (!shipment) {
    return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  let totalChargeCents: number;
  let invoiceDate: Date | null | undefined;
  let dueDate: Date | null | undefined;
  try {
    const cents = dollarsToCents(data.totalCharge);
    if (cents === null) throw new Error("totalCharge is required");
    totalChargeCents = cents;
    invoiceDate = parseOptionalDate(data.invoiceDate);
    dueDate = parseOptionalDate(data.dueDate);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid totalCharge or date" },
      { status: 400 }
    );
  }

  const invoiceNo = await generateInvoiceNumber(fileNumber);

  const invoice = await prisma.arInvoice.create({
    data: {
      shipmentId: shipment.id,
      fileNumber,
      invoiceNo,
      customerId: data.customerId,
      chargeCode: data.chargeCode ?? undefined,
      divisionId: shipment.divisionId ?? undefined,
      currencyCode: data.currencyCode ?? undefined,
      exchangeRate: data.exchangeRate ?? undefined,
      prepaidOrCollect: data.prepaidOrCollect ?? undefined,
      totalChargeCents,
      invoiceDescription: data.invoiceDescription ?? undefined,
      blPrintDescription: data.blPrintDescription ?? undefined,
      status: data.status,
      invoiceDate: invoiceDate ?? undefined,
      dueDate: dueDate ?? undefined,
      terms: data.terms ?? undefined,
    },
  });

  await recomputeShipmentBillableStatus(shipment.id);
  const qboSyncError = await autoSyncInvoiceIfPosted(invoice.id, invoice.status);

  return NextResponse.json({ ...invoice, qboSyncError }, { status: 201 });
}
