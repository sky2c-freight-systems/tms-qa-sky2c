import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { isZohoWebhookAuthorized } from "@/lib/zohoAuth";
import { extractEventEnvelope, resolveTicketMeta, truncate, MAX_TEXT_LEN } from "@/lib/zohoMapping";
import { createShipmentForTicket, claimShipmentCreationForTicket } from "@/lib/zohoShipmentSync";

/**
 * Zoho Desk "Ticket_Add" webhook. Auto-creates a DomesticWarehouseShipment from a
 * support ticket's custom fields. MUST always return HTTP 200 (see isZohoWebhookAuthorized
 * and the try/catch below) — Zoho retry-storms endpoints that don't 200, and failures here
 * are recorded on the ZohoSync row instead for later inspection.
 */
export async function POST(request: Request) {
  if (!isZohoWebhookAuthorized(request)) {
    console.warn("[zoho:ticket-created] rejected: invalid or missing shared-secret header");
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const rawBody = await request.text();
  let parsedBody: unknown = null;
  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    console.error("[zoho:ticket-created] failed to parse JSON body; storing raw body for audit only");
  }

  // Zoho sends `[{ payload: {...}, eventType: "Ticket_Add" }]`; defensively also accept a
  // bare object in case an org config posts one directly instead of wrapping in an array.
  const envelope = extractEventEnvelope(parsedBody);
  const payload = (envelope.payload ?? envelope) as Record<string, unknown>;

  const meta = resolveTicketMeta(payload);
  // zohoTicketId is a required unique key on ZohoSync; fall back to a generated id in the
  // (unexpected) case neither payload shape yields one, so we can still record the raw
  // payload for audit rather than throwing before any row exists.
  const zohoTicketId = meta.ticketId || `unknown-${randomUUID()}`;

  // Record the sync attempt immediately, before doing any of the real work, so the raw
  // payload is always captured for audit even if everything downstream throws.
  await prisma.zohoSync.upsert({
    where: { zohoTicketId },
    create: {
      zohoTicketId,
      zohoTicketNumber: meta.ticketNumber || undefined,
      ticketSubject: truncate(meta.subject, MAX_TEXT_LEN),
      ticketStatus: truncate(meta.status, MAX_TEXT_LEN),
      rawPayload: rawBody,
      syncStatus: "PENDING",
    },
    update: {
      zohoTicketNumber: meta.ticketNumber || undefined,
      ticketSubject: truncate(meta.subject, MAX_TEXT_LEN),
      ticketStatus: truncate(meta.status, MAX_TEXT_LEN),
      rawPayload: rawBody,
    },
  });

  // A near-simultaneous ticket-updated webhook for the same brand-new ticket
  // (common when a Zoho workflow rule sets custom fields right after creation)
  // can otherwise race this handler into creating two shipments for one
  // ticket — one from whichever payload arrived with fields not filled in
  // yet. Claim the right to create atomically; if we lose the race, the
  // other handler is already creating (or has created) the shipment.
  const claimed = await claimShipmentCreationForTicket(zohoTicketId);
  if (!claimed) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    const result = await createShipmentForTicket(payload, zohoTicketId);

    await prisma.zohoSync.update({
      where: { zohoTicketId },
      data: {
        fileNumber: result.fileNumber,
        clientName: result.accountName,
        origin: result.origin,
        destination: result.destination,
        carrier: result.carrierName,
        contactEmail: result.contactEmail,
        contactPhone: result.contactPhone,
        syncStatus: "SYNCED",
        errorMessage: null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[zoho:ticket-created] sync failed for ticket ${zohoTicketId}:`, err);
    await prisma.zohoSync
      .update({
        where: { zohoTicketId },
        // Release the claim sentinel on failure so a later retry (Zoho retries
        // any non-200, but this itself always returns 200 - a subsequent
        // ticket-updated event is the realistic retry path) isn't permanently
        // locked out from ever creating the shipment.
        data: { fileNumber: null, syncStatus: "FAILED", errorMessage: truncate(message, MAX_TEXT_LEN) },
      })
      .catch((updateErr) => {
        console.error(`[zoho:ticket-created] failed to record FAILED status for ticket ${zohoTicketId}:`, updateErr);
      });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
