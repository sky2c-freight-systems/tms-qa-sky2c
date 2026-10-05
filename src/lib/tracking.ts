import type { ShipmentStatus, TrackingEventSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SHIPMENT_STATUS_LABELS } from "@/lib/enumLabels";

/**
 * The one place tracking events are written and read. Every status transition in the app
 * funnels through recordTrackingEvent so the public timeline can't silently drift from
 * the shipment's real history — see prisma/schema.prisma's ShipmentTrackingEvent.
 */

/**
 * Milestones a shipment is expected to pass through, in order, for the progress bar on
 * the tracking page. Deliberately excludes the exception statuses (ON_HOLD, ESCALATED,
 * CANCELLED) and the pre-shipment ones (QUOTE_SENT) — those are real events and still
 * appear in the timeline, they just aren't steps on the happy path.
 */
export const TRACKING_MILESTONES: ShipmentStatus[] = [
  "SCHEDULED",
  "PICKED_UP",
  "INTRANSIT",
  "ON_HAND",
  "DELIVERED",
];

/** Statuses that end the journey — the progress bar stops advancing and renders as terminal. */
const TERMINAL_STATUSES: ShipmentStatus[] = ["DELIVERED", "CLOSED", "CANCELLED"];

/** Customer-facing one-liners. The enum label alone ("On Hand") doesn't tell a customer what happened. */
const STATUS_BLURBS: Record<ShipmentStatus, string> = {
  OPEN: "We've received your shipment request and are getting it set up.",
  QUOTE_SENT: "A quote has been sent and is awaiting approval.",
  SCHEDULED: "Your shipment is booked and scheduled for pickup.",
  PICKED_UP: "Your shipment has been picked up and is on its way into our network.",
  INTRANSIT: "Your shipment is moving between facilities.",
  ON_HAND: "Your shipment has arrived at the destination facility.",
  DELIVERED: "Your shipment was delivered.",
  ON_HOLD: "Your shipment is temporarily on hold. We'll update this page when it moves again.",
  ESCALATED: "This shipment needs attention and has been escalated to our team.",
  CANCELLED: "This shipment was cancelled.",
  CLOSED: "This shipment is complete and the file has been closed.",
};

export function statusLabel(status: ShipmentStatus): string {
  return SHIPMENT_STATUS_LABELS[status] ?? status;
}

export function statusBlurb(status: ShipmentStatus): string {
  return STATUS_BLURBS[status] ?? "";
}

export function isTerminalStatus(status: ShipmentStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** True when the shipment ended in a way that shouldn't render as a green success state. */
export function isFailedStatus(status: ShipmentStatus): boolean {
  return status === "CANCELLED";
}

interface RecordTrackingEventInput {
  shipmentId: string;
  fileNumber: string;
  status: ShipmentStatus;
  source?: TrackingEventSource;
  note?: string | null;
  location?: string | null;
  occurredAt?: Date;
}

/**
 * Appends a tracking event. Best-effort by design: the timeline is a presentation
 * concern, and failing to write a history row must never roll back or fail the shipment
 * write that actually matters — same philosophy as the Zoho push-back.
 */
export async function recordTrackingEvent(input: RecordTrackingEventInput): Promise<void> {
  try {
    await prisma.shipmentTrackingEvent.create({
      data: {
        shipmentId: input.shipmentId,
        fileNumber: input.fileNumber,
        status: input.status,
        source: input.source ?? "SYSTEM",
        note: input.note ?? null,
        location: input.location ?? null,
        occurredAt: input.occurredAt ?? new Date(),
      },
    });
  } catch (err) {
    console.error(`[tracking] failed to record ${input.status} event for ${input.fileNumber}:`, err);
  }
}

/**
 * Records a transition only when the status actually changed. Callers routinely PATCH a
 * shipment with its existing status (the list page's dropdown re-submits the current
 * value on any edit), and logging those would fill the timeline with duplicate rows.
 */
export async function recordStatusChange(
  shipmentId: string,
  fileNumber: string,
  previousStatus: ShipmentStatus | null,
  nextStatus: ShipmentStatus,
  source: TrackingEventSource,
  location?: string | null
): Promise<void> {
  if (previousStatus === nextStatus) return;
  await recordTrackingEvent({ shipmentId, fileNumber, status: nextStatus, source, location });
}
