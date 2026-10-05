/** Human-readable labels for the Prisma enums, for <select> options across shipment/quote/billing forms. */

// Mirrors Zoho Desk's ticket status list exactly — see src/lib/zohoStatusMap.ts.
export const SHIPMENT_STATUS_LABELS: Record<string, string> = {
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

export const DOMESTIC_TYPE_LABELS: Record<string, string> = {
  TRUCK: "Truck",
  TRUCK_TEAM: "Truck Team",
  RAIL: "Rail",
  MOTOR_RAIL: "Motor Rail",
  DOMESTIC_AIR: "Domestic Air",
  PICKUP: "Pickup",
  RETURN: "Return",
  OTHER: "Other",
};

export const INCOTERMS_LABELS: Record<string, string> = {
  CFR: "CFR — Cost and Freight",
  CIF: "CIF — Cost, Insurance and Freight",
  CIP: "CIP — Carriage and Insurance Paid To",
  CPT: "CPT — Carriage Paid To",
  DAP: "DAP — Delivered at Place",
  DAT: "DAT — Delivered at Terminal",
  DDP: "DDP — Delivered Duty Paid",
  EXW: "EXW — Ex Works",
  FAS: "FAS — Free Alongside Ship",
  FCA: "FCA — Free Carrier",
  FOB: "FOB — Free on Board",
};

export const TYPE_OF_SERVICE_LABELS: Record<string, string> = {
  RESIDENTIAL_TO_RESIDENTIAL: "Residential Pickup / Residential Delivery",
  RESIDENTIAL_TO_WAREHOUSE: "Residential Pickup / Warehouse Delivery",
  RESIDENTIAL_TO_TERMINAL: "Residential Pickup / Terminal Delivery",
  WAREHOUSE_TO_RESIDENTIAL: "Warehouse Pickup / Residential Delivery",
  WAREHOUSE_TO_WAREHOUSE: "Warehouse Pickup / Warehouse Delivery",
  WAREHOUSE_TO_TERMINAL: "Warehouse Pickup / Terminal Delivery",
  TERMINAL_TO_RESIDENTIAL: "Terminal Pickup / Residential Delivery",
  TERMINAL_TO_WAREHOUSE: "Terminal Pickup / Warehouse Delivery",
  TERMINAL_TO_TERMINAL: "Terminal Pickup / Terminal Delivery",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PREPAID: "Prepaid",
  COLLECT: "Collect",
  DIRECT: "Direct",
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  NOT_APPLICABLE: "Not Applicable",
  IN_PROGRESS: "In Progress",
  POSTED: "Posted",
  CANCELLED: "Cancelled",
  DELETED: "Deleted",
};

export const BILLABLE_STATUS_LABELS: Record<string, string> = INVOICE_STATUS_LABELS;

export function toOptions(labels: Record<string, string>): Array<{ value: string; label: string }> {
  return Object.entries(labels).map(([value, label]) => ({ value, label }));
}
