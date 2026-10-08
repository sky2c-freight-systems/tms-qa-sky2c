/**
 * The Zoho Desk ticket layout sections ("Dispatch to Warehouse" layout), mirrored on the
 * Shipment form. Single source of truth for:
 *   - which fields each section shows, in Zoho's order;
 *   - the Shipment-only fields added for these sections (EXTRA_FIELDS) — their type,
 *     picklist options and Zoho custom-field API name;
 *   - which existing Shipment fields stand in for a Zoho field instead of being
 *     duplicated (EXISTING items).
 *
 * `zohoField` is the ticket custom-field API name as it appears in webhook payloads
 * (`payload.cf.*`). It's recorded here for the Zoho <-> Shipment sync; nothing reads it
 * yet. Picklist options are the values seen on live tickets so far — the OAuth grant
 * lacks the scope to read the field definitions directly.
 */

import { z } from "zod";
import { dollarsToCents } from "@/lib/money";

export type ExtraFieldType = "text" | "textarea" | "picklist" | "multiselect" | "decimal" | "currency" | "datetime";

export interface ExtraFieldDef {
  /** Form/API key. Also the Prisma column, except currency fields which persist to `${key}Cents`. */
  key: string;
  label: string;
  type: ExtraFieldType;
  zohoField: string;
  options?: readonly string[];
}

export const EXTRA_FIELDS = [
  // Dispatch Instructions
  { key: "shipperStatus", label: "Shipper", type: "picklist", zohoField: "cf_shipper_1", options: ["Known", "Yet to Confirm", "Unknown"] },
  { key: "quoteBasis", label: "Quote Basis", type: "picklist", zohoField: "cf_quote_basis", options: ["Yet to Confirm", "Per Kg", "Flat"] },
  { key: "quotedBy", label: "Quoted By", type: "text", zohoField: "cf_quoted_by" },
  { key: "palletsDimensions", label: "Pallets x Dimensions", type: "textarea", zohoField: "cf_pallets_x_dimensions" },
  { key: "grossWeight", label: "Gross Weight", type: "decimal", zohoField: "cf_gross_weight" },
  { key: "volumetricWeight", label: "Volumetric Weight", type: "decimal", zohoField: "cf_volumetric_weight" },
  { key: "chargeableWeight", label: "Chargeable Weight", type: "decimal", zohoField: "cf_chargeable_weight" },
  {
    key: "stackableTurnable",
    label: "Stackable and Turnable",
    type: "multiselect",
    zohoField: "cf_stackable_and_turnable",
    options: ["Stackable", "Turnable", "Non-Stackable"],
  },
  { key: "serviceType", label: "Service Type", type: "picklist", zohoField: "cf_service_type", options: ["Door to Port", "Door to Door"] },

  // Pickup Instructions
  { key: "contactDetails", label: "Contact Details", type: "textarea", zohoField: "cf_contact_details" },
  { key: "locationType", label: "Location Type", type: "picklist", zohoField: "cf_location_type", options: ["Commercial", "Residential"] },
  { key: "dockHours", label: "Dock Hours", type: "text", zohoField: "cf_dock_hours" },
  { key: "soNumber", label: "SO Number", type: "text", zohoField: "cf_variable_2" },
  { key: "preferredPickupAt", label: "Preferred Pickup Date", type: "datetime", zohoField: "cf_preferred_pickup_date" },
  { key: "pickupInstructions", label: "Pickup Instructions", type: "textarea", zohoField: "cf_pickup_instructions" },

  // Dispatch Operations
  { key: "dispatchRoute", label: "Dispatch Route", type: "picklist", zohoField: "cf_dispatch_route", options: ["Via Warehouse", "Direct to Port"] },
  { key: "warehouseLocation", label: "Warehouse Location", type: "text", zohoField: "cf_warehouse_location" },
  {
    key: "carrierPicklist",
    label: "Carrier-Name",
    type: "picklist",
    zohoField: "cf_carrier_picklist",
    options: [
      "AAA Cooper",
      "Best Express",
      "Daylight Transport",
      "Estes",
      "Estes Forwarding Worldwide",
      "Fedex",
      "Finnair",
      "Forward Air",
      "Mothership",
      "PTS",
      "Road Runner Freight",
      "Saia LTL Freight",
      "SKY2C FREIGHT SYSTEMS INC",
      "Southeastern Freight Lines",
      "Vhaul4u",
      "Other",
    ],
  },
  { key: "pickupRefNumber", label: "Pickup Ref Number", type: "text", zohoField: "cf_pick_up_ref_number" },
  { key: "estimatedTruckingCost", label: "Estimated Trucking Cost ($)", type: "currency", zohoField: "cf_estimated_trucking_cost" },
  { key: "pickupScheduleAt", label: "Pickup Schedule Time", type: "datetime", zohoField: "cf_pickup_schedule_time" },
  { key: "etaForPickupAt", label: "ETA for Pickup", type: "datetime", zohoField: "cf_pickup_time" },
  { key: "etaAtWarehouseAt", label: "ETA at Warehouse", type: "datetime", zohoField: "cf_eta_at_warehouse" },
  { key: "onHandAt", label: "On-Hand Date", type: "datetime", zohoField: "cf_on_hand_date" },
  { key: "onHandDetails", label: "On-Hand Details", type: "textarea", zohoField: "cf_on_hand_details" },
] as const satisfies readonly ExtraFieldDef[];

export type ExtraFieldKey = (typeof EXTRA_FIELDS)[number]["key"];

const EXTRA_FIELD_BY_KEY = new Map<string, ExtraFieldDef>(EXTRA_FIELDS.map((f) => [f.key, f]));

/** Existing Shipment form fields that stand in for a Zoho ticket field. */
export type ExistingSectionFieldKey =
  | "origin"
  | "destination"
  | "totalCharges"
  | "cargoDescription"
  | "incoTerms"
  | "placeOfReceipt"
  | "carrierId"
  | "proNumber"
  | "bolNumber"
  | "shipAt";

export type SectionItem =
  | { kind: "extra"; field: ExtraFieldDef }
  | { kind: "existing"; key: ExistingSectionFieldKey; label: string; zohoField: string };

export interface ZohoSection {
  title: string;
  items: SectionItem[];
}

const extra = (key: ExtraFieldKey): SectionItem => ({ kind: "extra", field: EXTRA_FIELD_BY_KEY.get(key)! });
const existing = (key: ExistingSectionFieldKey, label: string, zohoField: string): SectionItem => ({
  kind: "existing",
  key,
  label,
  zohoField,
});

export const ZOHO_SECTIONS: ZohoSection[] = [
  {
    title: "Dispatch Instructions",
    items: [
      existing("origin", "Origin Port", "cf_origin"),
      existing("destination", "Destination Port", "cf_destination"),
      extra("shipperStatus"),
      existing("totalCharges", "Quote Amount ($)", "cf_quote_amount_1"),
      extra("quoteBasis"),
      extra("quotedBy"),
      extra("palletsDimensions"),
      extra("grossWeight"),
      extra("volumetricWeight"),
      extra("chargeableWeight"),
      existing("cargoDescription", "Commodity Detail", "cf_commodity_detail"),
      extra("stackableTurnable"),
      extra("serviceType"),
      existing("incoTerms", "Shipment Terms", "cf_trucking_by"),
    ],
  },
  {
    title: "Pickup Instructions",
    items: [
      existing("placeOfReceipt", "Pickup Location", "cf_pickup_location"),
      extra("contactDetails"),
      extra("locationType"),
      extra("dockHours"),
      extra("soNumber"),
      extra("preferredPickupAt"),
      extra("pickupInstructions"),
    ],
  },
  {
    title: "Dispatch Operations",
    items: [
      extra("dispatchRoute"),
      extra("warehouseLocation"),
      extra("carrierPicklist"),
      existing("carrierId", "Carrier", "cf_carrier"),
      existing("proNumber", "Pro Number", "cf_pro_number"),
      existing("bolNumber", "BOL", "cf_bol"),
      extra("pickupRefNumber"),
      extra("estimatedTruckingCost"),
      extra("pickupScheduleAt"),
      extra("etaForPickupAt"),
      existing("shipAt", "Pickup Date", "cf_pickup_date"),
      extra("etaAtWarehouseAt"),
      extra("onHandAt"),
      extra("onHandDetails"),
    ],
  },
];

// ---------------------------------------------------------------------------
// Zoho ticket -> Shipment
// ---------------------------------------------------------------------------

const INCOTERMS = new Set(["CFR", "CIF", "CIP", "CPT", "DAP", "DAT", "DDP", "EXW", "FAS", "FCA", "FOB"]);

function zohoToDbValue(f: ExtraFieldDef, raw: unknown): unknown {
  if (raw === null || raw === undefined || String(raw).trim() === "") {
    return f.type === "multiselect" ? [] : null;
  }
  const s = String(raw).trim();
  switch (f.type) {
    case "multiselect":
      return s.split(MULTI_SEP).map((x) => x.trim()).filter(Boolean);
    case "decimal": {
      const n = Number(s.replace(/,/g, ""));
      return Number.isNaN(n) ? null : n;
    }
    case "currency":
      try {
        return dollarsToCents(s);
      } catch {
        return null;
      }
    case "datetime": {
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    default:
      return s;
  }
}

/**
 * Ticket custom fields (`payload.cf`) -> Prisma data for the section fields that the
 * generic draft mapping (zohoMapping.ts) doesn't cover: every EXTRA_FIELD, plus the
 * existing Pickup Location (placeOfReceipt) and Shipment Terms (incoTerms) columns.
 * Zoho is the source of truth: a field that's empty on the ticket is cleared here.
 * Fields missing from `cf` altogether are left out, so they're never wiped by a
 * payload that simply doesn't carry them.
 */
export function zohoCfToSectionData(cf: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of EXTRA_FIELDS as readonly ExtraFieldDef[]) {
    if (!(f.zohoField in cf)) continue;
    out[dbKey(f)] = zohoToDbValue(f, cf[f.zohoField]);
  }
  if ("cf_pickup_location" in cf) {
    const v = cf.cf_pickup_location;
    out.placeOfReceipt = v === null || v === undefined || String(v).trim() === "" ? null : String(v).trim();
  }
  if ("cf_trucking_by" in cf) {
    const v = String(cf.cf_trucking_by ?? "").trim().toUpperCase();
    // Only known Inco Terms; an unrecognised value leaves the existing one alone.
    if (v === "") out.incoTerms = null;
    else if (INCOTERMS.has(v)) out.incoTerms = v;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Form <-> record <-> API conversion for EXTRA_FIELDS
// ---------------------------------------------------------------------------

export type ExtraFieldFormValues = Record<ExtraFieldKey, string>;

/** Separator for multiselect values in form state — matches Zoho's own `a;b;c` encoding. */
const MULTI_SEP = ";";

export function emptyExtraFieldValues(): ExtraFieldFormValues {
  return Object.fromEntries(EXTRA_FIELDS.map((f) => [f.key, ""])) as ExtraFieldFormValues;
}

function dbKey(f: ExtraFieldDef): string {
  return f.type === "currency" ? `${f.key}Cents` : f.key;
}

/** Shipment record (raw prisma row / GET response) -> form strings. */
export function extraFieldsToFormValues(
  record: Record<string, unknown>,
  toDatetimeLocal: (v: unknown) => string
): ExtraFieldFormValues {
  const out = emptyExtraFieldValues();
  for (const f of EXTRA_FIELDS as readonly ExtraFieldDef[]) {
    const v = record[dbKey(f)];
    if (v === null || v === undefined) continue;
    const key = f.key as ExtraFieldKey;
    if (f.type === "datetime") out[key] = toDatetimeLocal(v);
    else if (f.type === "currency") out[key] = (Number(v) / 100).toFixed(2);
    else if (f.type === "multiselect") out[key] = Array.isArray(v) ? v.join(MULTI_SEP) : String(v);
    else out[key] = String(v);
  }
  return out;
}

/** Form strings -> request body values (null clears a field). */
export function extraFieldsToBody(values: ExtraFieldFormValues): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of EXTRA_FIELDS as readonly ExtraFieldDef[]) {
    const raw = values[f.key as ExtraFieldKey] ?? "";
    if (f.type === "multiselect") {
      out[f.key] = raw.split(MULTI_SEP).map((s) => s.trim()).filter(Boolean);
    } else if (f.type === "datetime") {
      out[f.key] = raw ? new Date(raw).toISOString() : null;
    } else {
      out[f.key] = raw.trim() ? raw : null;
    }
  }
  return out;
}

const numberish = z.union([z.string(), z.number()]).nullish();

function zodFor(f: ExtraFieldDef) {
  switch (f.type) {
    case "multiselect":
      return z.array(z.string()).nullish();
    case "decimal":
    case "currency":
      return numberish;
    default:
      return z.string().nullish();
  }
}

/** zod shape for EXTRA_FIELDS — spread into the create/patch request schemas. */
export const extraFieldsZodShape = Object.fromEntries(
  (EXTRA_FIELDS as readonly ExtraFieldDef[]).map((f) => [f.key, zodFor(f)])
) as Record<ExtraFieldKey, ReturnType<typeof zodFor>>;

/**
 * Parsed request body -> Prisma data for EXTRA_FIELDS. Only keys present in `data` are
 * returned (so PATCH stays a partial update). Throws on an unparseable number/date —
 * callers turn that into a 400.
 */
export function extraFieldsToPrismaData(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of EXTRA_FIELDS as readonly ExtraFieldDef[]) {
    const v = data[f.key];
    if (v === undefined) continue;
    const col = dbKey(f);
    if (v === null || v === "") {
      out[col] = f.type === "multiselect" ? [] : null;
      continue;
    }
    switch (f.type) {
      case "decimal": {
        const n = Number(String(v).replace(/,/g, ""));
        if (Number.isNaN(n)) throw new Error(`Invalid number for ${f.label}: ${v}`);
        out[col] = n;
        break;
      }
      case "currency":
        out[col] = dollarsToCents(v as string | number);
        break;
      case "datetime": {
        const d = new Date(String(v));
        if (Number.isNaN(d.getTime())) throw new Error(`Invalid date for ${f.label}: ${v}`);
        out[col] = d;
        break;
      }
      default:
        out[col] = v;
    }
  }
  return out;
}
