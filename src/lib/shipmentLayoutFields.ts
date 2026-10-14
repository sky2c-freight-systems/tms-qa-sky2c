/**
 * Glue between the Zoho layouts (src/lib/zohoLayouts.ts) and the Shipment record.
 *
 * A layout field is stored in one of two places:
 *   - "column-backed": the field already has a Shipment column — an EXTRA_FIELD or one of
 *     the existing columns the Zoho sections reuse (origin, destination, totalCharges, ...;
 *     see src/lib/shipmentZohoSections.ts). Those columns feed the list, billing and
 *     documents, so the layout form edits them directly instead of a second copy.
 *   - "generic": everything else, kept in the Shipment's `zohoFields` JSON keyed by the
 *     Zoho API name — so a new layout field needs no schema change.
 *
 * Values in `zohoFields`: boolean for Boolean fields, string[] for Multiselect, otherwise
 * the string Zoho sends (ISO for DateTime, YYYY-MM-DD for Date), or null when empty.
 */

import {
  EXTRA_FIELDS,
  ZOHO_SECTIONS,
  type ExistingSectionFieldKey,
  type ExtraFieldDef,
} from "@/lib/shipmentZohoSections";
import { ALL_LAYOUT_FIELDS, type LayoutField } from "@/lib/zohoLayouts";

export type ZohoFieldValue = string | string[] | boolean | null;
export type ZohoFieldsRecord = Record<string, ZohoFieldValue>;

export type ColumnBacking =
  | { kind: "extra"; field: ExtraFieldDef }
  | { kind: "existing"; key: ExistingSectionFieldKey };

/** Zoho API name -> the Shipment column that already holds it. */
export const COLUMN_FOR_ZOHO_FIELD: ReadonlyMap<string, ColumnBacking> = (() => {
  const m = new Map<string, ColumnBacking>();
  for (const f of EXTRA_FIELDS as readonly ExtraFieldDef[]) m.set(f.zohoField, { kind: "extra", field: f });
  for (const s of ZOHO_SECTIONS) {
    for (const item of s.items) {
      if (item.kind === "existing" && !m.has(item.zohoField)) m.set(item.zohoField, { kind: "existing", key: item.key });
    }
  }
  return m;
})();

/** Layout fields with no Shipment column — stored in `zohoFields`. */
export const GENERIC_LAYOUT_FIELDS: readonly LayoutField[] = ALL_LAYOUT_FIELDS.filter(
  (f) => !COLUMN_FOR_ZOHO_FIELD.has(f.apiName)
);

const GENERIC_BY_API_NAME = new Map(GENERIC_LAYOUT_FIELDS.map((f) => [f.apiName, f]));

/** Zoho uses "-None-"/"None" as the empty picklist choice. */
function isNoneValue(s: string): boolean {
  return s === "" || s === "-None-" || s === "None";
}

function normalize(f: LayoutField, raw: unknown): ZohoFieldValue {
  if (f.type === "boolean") return raw === true || String(raw).toLowerCase() === "true";
  if (raw === null || raw === undefined) return f.type === "multiselect" ? [] : null;
  if (f.type === "multiselect") {
    const parts = Array.isArray(raw) ? raw.map(String) : String(raw).split(";");
    return parts.map((s) => s.trim()).filter((s) => !isNoneValue(s));
  }
  const s = String(raw).trim();
  return isNoneValue(s) ? null : s;
}

/**
 * Ticket custom fields (`payload.cf`) -> `zohoFields` entries for the generic layout
 * fields. Only fields present in `cf` are returned, so merging this over the stored
 * object never wipes a field a payload simply didn't carry. Zoho is the source of truth:
 * a field that's empty on the ticket comes back empty.
 */
export function zohoCfToLayoutFields(cf: Record<string, unknown>): ZohoFieldsRecord {
  const out: ZohoFieldsRecord = {};
  for (const f of GENERIC_LAYOUT_FIELDS) {
    if (f.apiName in cf) out[f.apiName] = normalize(f, cf[f.apiName]);
  }
  return out;
}

/** Reads a stored `zohoFields` JSON value back as a record (tolerates null/garbage). */
export function asZohoFields(value: unknown): ZohoFieldsRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as ZohoFieldsRecord) : {};
}

/**
 * Request body `zohoFields` -> what gets persisted: unknown keys dropped, each value
 * coerced to its field's type. Returns undefined when the body didn't send the field.
 */
export function sanitizeZohoFields(input: unknown): ZohoFieldsRecord | undefined {
  if (input === undefined) return undefined;
  const src = asZohoFields(input);
  const out: ZohoFieldsRecord = {};
  for (const [key, raw] of Object.entries(src)) {
    const f = GENERIC_BY_API_NAME.get(key);
    if (f) out[key] = normalize(f, raw);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Form state: every generic field as a string, like the other Shipment form fields —
// multiselect joined with ";" (Zoho's encoding), boolean as "true" / "".
// ---------------------------------------------------------------------------

export type LayoutFieldFormValues = Record<string, string>;

function toDateInput(v: string): string {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(v);
  return m ? m[1] : "";
}

export function zohoFieldsToFormValues(
  stored: unknown,
  toDatetimeLocal: (v: unknown) => string
): LayoutFieldFormValues {
  const rec = asZohoFields(stored);
  const out: LayoutFieldFormValues = {};
  for (const f of GENERIC_LAYOUT_FIELDS) {
    const v = rec[f.apiName];
    if (v === null || v === undefined || v === false) continue;
    if (f.type === "boolean") out[f.apiName] = v === true ? "true" : "";
    else if (Array.isArray(v)) out[f.apiName] = v.join(";");
    else if (f.type === "datetime") out[f.apiName] = toDatetimeLocal(v);
    else if (f.type === "date") out[f.apiName] = toDateInput(String(v));
    else out[f.apiName] = String(v);
  }
  return out;
}

export function layoutFormValuesToBody(values: LayoutFieldFormValues): ZohoFieldsRecord {
  const out: ZohoFieldsRecord = {};
  for (const f of GENERIC_LAYOUT_FIELDS) {
    const raw = values[f.apiName] ?? "";
    if (f.type === "boolean") out[f.apiName] = raw === "true";
    else if (f.type === "multiselect") out[f.apiName] = raw.split(";").map((s) => s.trim()).filter(Boolean);
    else if (f.type === "datetime") out[f.apiName] = raw ? new Date(raw).toISOString() : null;
    else out[f.apiName] = raw.trim() ? raw.trim() : null;
  }
  return out;
}
