/**
 * Shared list of the 16 DomesticWarehouseQuote accessorial boolean flags, with display
 * labels. Used by both <QuoteForm> (checkbox grid) and the quote print template (which
 * renders only the flags that are true, as a tag list) so the field set + labels only
 * exist in one place.
 */
export type AccessorialFlagField =
  | "isHazardous"
  | "isHighValue"
  | "isOverweight"
  | "isOversize"
  | "isBonded"
  | "isPerishable"
  | "needsExtraMan"
  | "needsTempControl"
  | "insidePickup"
  | "insideDelivery"
  | "liftgatePickup"
  | "liftgateDelivery"
  | "residentialPickup"
  | "residentialDelivery"
  | "appointmentAtPickup"
  | "appointmentAtDelivery";

export const ACCESSORIAL_FLAGS: { field: AccessorialFlagField; label: string }[] = [
  { field: "isHazardous", label: "Hazardous" },
  { field: "isHighValue", label: "High Value" },
  { field: "isOverweight", label: "Overweight" },
  { field: "isOversize", label: "Oversize" },
  { field: "isBonded", label: "Bonded" },
  { field: "isPerishable", label: "Perishable" },
  { field: "needsExtraMan", label: "Extra Man Required" },
  { field: "needsTempControl", label: "Temp. Control Required" },
  { field: "insidePickup", label: "Inside Pickup" },
  { field: "insideDelivery", label: "Inside Delivery" },
  { field: "liftgatePickup", label: "Liftgate Pickup" },
  { field: "liftgateDelivery", label: "Liftgate Delivery" },
  { field: "residentialPickup", label: "Residential Pickup" },
  { field: "residentialDelivery", label: "Residential Delivery" },
  { field: "appointmentAtPickup", label: "Appointment at Pickup" },
  { field: "appointmentAtDelivery", label: "Appointment at Delivery" },
];

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  EXPIRED: "Expired",
  CONVERTED: "Converted",
};

export const QUOTE_STATUS_VALUES = ["DRAFT", "SENT", "ACCEPTED", "EXPIRED", "CONVERTED"] as const;
export type QuoteStatus = (typeof QUOTE_STATUS_VALUES)[number];
