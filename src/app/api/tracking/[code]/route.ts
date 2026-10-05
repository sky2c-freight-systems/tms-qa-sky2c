import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { statusBlurb, statusLabel } from "@/lib/tracking";
import { getTicketAttachments, isCustomerVisibleAttachment } from "@/lib/zohoDeskApi";

/**
 * Best-effort: pulls only the customer-visible attachments (PICKUP_ZOHO/BOL_SIGNED_*
 * naming convention — see isCustomerVisibleAttachment) off the Zoho ticket, for display
 * on the public tracking page/response. Everything else on the ticket stays hidden —
 * anyone with the tracking code/link can reach this page, not just the customer. Never
 * throws — a Zoho outage or missing credentials must not break tracking, which has
 * nothing to do with Zoho from the customer's perspective.
 */
async function getPublicAttachments(zohoTicketId: string | null | undefined) {
  if (!zohoTicketId) return [];
  try {
    const attachments = await getTicketAttachments(zohoTicketId);
    return attachments.filter((a) => isCustomerVisibleAttachment(a.name)).map((a) => ({ id: a.id, name: a.name }));
  } catch (err) {
    console.error(`[tracking] failed to load Zoho attachments for ticket ${zohoTicketId}:`, err);
    return [];
  }
}

/**
 * Public tracking lookup — deliberately unauthenticated, like any carrier's tracking
 * page. `code` is either a shipment fileNumber or the Zoho ticket number a customer was
 * given, since customers are handed whichever one the originating email quoted.
 *
 * The response is scoped to what a customer may see: milestones, origin/destination, and
 * the carrier. Pricing, client records, invoices, internal ids and the raw Zoho payload
 * are all withheld — knowing a tracking number must not expose commercial data.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await params;
  const code = rawCode.trim();
  if (!code) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Try the file number first, then fall back to resolving a Zoho ticket number through
  // the sync table. Both are user-facing identifiers for the same shipment.
  let shipment = await prisma.domesticWarehouseShipment.findUnique({ where: { fileNumber: code } });

  if (!shipment) {
    const sync = await prisma.zohoSync.findFirst({
      where: { zohoTicketNumber: code, fileNumber: { not: null } },
      select: { fileNumber: true },
    });
    if (sync?.fileNumber) {
      shipment = await prisma.domesticWarehouseShipment.findUnique({ where: { fileNumber: sync.fileNumber } });
    }
  }

  // Same 404 for "no such number" and "number exists but is inactive", so the endpoint
  // can't be used to probe which file numbers are real.
  if (!shipment || !shipment.isActive) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [events, sync, carrier] = await Promise.all([
    prisma.shipmentTrackingEvent.findMany({
      where: { shipmentId: shipment.id },
      orderBy: { occurredAt: "asc" },
      select: { status: true, note: true, location: true, occurredAt: true, source: true },
    }),
    prisma.zohoSync.findFirst({
      where: { fileNumber: shipment.fileNumber },
      select: { zohoTicketId: true, zohoTicketNumber: true, ticketSubject: true },
    }),
    shipment.carrierId
      ? prisma.client.findUnique({ where: { id: shipment.carrierId }, select: { name: true } })
      : Promise.resolve(null),
  ]);

  const attachments = await getPublicAttachments(sync?.zohoTicketId);

  return NextResponse.json({
    data: {
      fileNumber: shipment.fileNumber,
      zohoTicketNumber: sync?.zohoTicketNumber ?? null,
      subject: sync?.ticketSubject ?? null,
      status: shipment.status,
      statusLabel: statusLabel(shipment.status),
      statusBlurb: statusBlurb(shipment.status),
      origin: shipment.origin,
      destination: shipment.destination,
      carrierName: carrier?.name ?? null,
      proNumber: shipment.proNumber,
      shipAt: shipment.shipAt,
      etaAt: shipment.etaAt,
      createdAt: shipment.createdAt,
      events: events.map((e) => ({
        status: e.status,
        label: statusLabel(e.status),
        note: e.note,
        location: e.location,
        occurredAt: e.occurredAt,
        source: e.source,
      })),
      attachments,
    },
  });
}
