import type { ShipmentStatus } from "@prisma/client";

/**
 * Two-way mapping between Zoho Desk's ticket status labels (exactly as configured in
 * this org's Desk department — see the status list screenshot in the integration
 * discussion) and the ShipmentStatus enum. Keep both directions and the Prisma enum
 * (prisma/schema.prisma) in lockstep — every Zoho status has exactly one ShipmentStatus
 * counterpart and vice versa, so status changes can sync in either direction without a
 * lossy fallback.
 */
const ZOHO_STATUS_TO_SHIPMENT_STATUS: Record<string, ShipmentStatus> = {
  open: "OPEN",
  scheduled: "SCHEDULED",
  intransit: "INTRANSIT",
  "picked up": "PICKED_UP",
  "on hold": "ON_HOLD",
  delivered: "DELIVERED",
  "on hand": "ON_HAND",
  escalated: "ESCALATED",
  "quote sent": "QUOTE_SENT",
  cancelled: "CANCELLED",
  closed: "CLOSED",
};

const SHIPMENT_STATUS_TO_ZOHO_STATUS: Record<ShipmentStatus, string> = {
  OPEN: "Open",
  SCHEDULED: "Scheduled",
  INTRANSIT: "Intransit",
  PICKED_UP: "Picked up",
  ON_HOLD: "On Hold",
  DELIVERED: "Delivered",
  ON_HAND: "On Hand",
  ESCALATED: "Escalated",
  QUOTE_SENT: "Quote Sent",
  CANCELLED: "Cancelled",
  CLOSED: "Closed",
};

/** Maps a raw Zoho ticket status string to a ShipmentStatus, or null if it doesn't match any known Zoho status (case-insensitive). */
export function mapZohoStatusToShipmentStatus(raw: string | null | undefined): ShipmentStatus | null {
  if (!raw) return null;
  return ZOHO_STATUS_TO_SHIPMENT_STATUS[raw.trim().toLowerCase()] ?? null;
}

/** Maps a ShipmentStatus back to the exact Zoho Desk status label to push onto a ticket. */
export function mapShipmentStatusToZohoStatus(status: ShipmentStatus): string {
  return SHIPMENT_STATUS_TO_ZOHO_STATUS[status];
}
