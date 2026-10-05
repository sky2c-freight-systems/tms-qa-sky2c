"use client";

import ClientLookupField from "@/components/ClientLookupField";
import LocationLookupField from "@/components/LocationLookupField";
import { INCOTERMS_LABELS, toOptions } from "@/lib/enumLabels";
import { ACCESSORIAL_FLAGS, QUOTE_STATUS_LABELS, QUOTE_STATUS_VALUES, type AccessorialFlagField } from "@/lib/quoteAccessorials";

/**
 * Shared field-set for creating/editing a DomesticWarehouseQuote. Used by both
 * /quotes/new (POST /api/quotes) and /quotes/[id] (PATCH /api/quotes/[id]) so the
 * markup for the ~35 quote fields only exists once, matching the pattern
 * <ClientForm> established for the Client module. Cargo line items are NOT part of
 * this form — they're a separate nested editor on the /quotes/[id] page, since a
 * new quote must be saved (and get an id) before items can be attached to it.
 */

export interface QuoteFormValues {
  customerId: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string;

  pickupLocation: string;
  dischargeLocation: string;
  finalDestination: string;
  incoTerms: string; // "" = unset
  incoTermsLocation: string;

  effectiveDate: string; // yyyy-mm-dd or ""
  expirationDate: string;
  quotedBy: string;
  salesRep: string;

  carrierId: string | null;
  voyageVessel: string;

  paymentTerms: string;
  transitTime: string;

  quotedAmount: string; // dollar string
  status: string;

  // Accessorial flags
  isHazardous: boolean;
  isHighValue: boolean;
  isOverweight: boolean;
  isOversize: boolean;
  isBonded: boolean;
  isPerishable: boolean;
  needsExtraMan: boolean;
  needsTempControl: boolean;
  insidePickup: boolean;
  insideDelivery: boolean;
  liftgatePickup: boolean;
  liftgateDelivery: boolean;
  residentialPickup: boolean;
  residentialDelivery: boolean;
  appointmentAtPickup: boolean;
  appointmentAtDelivery: boolean;
}

export const EMPTY_QUOTE_FORM_VALUES: QuoteFormValues = {
  customerId: null,
  contactName: "",
  contactEmail: "",
  contactPhone: "",

  pickupLocation: "",
  dischargeLocation: "",
  finalDestination: "",
  incoTerms: "",
  incoTermsLocation: "",

  effectiveDate: "",
  expirationDate: "",
  quotedBy: "",
  salesRep: "",

  carrierId: null,
  voyageVessel: "",

  paymentTerms: "",
  transitTime: "",

  quotedAmount: "",
  status: "DRAFT",

  isHazardous: false,
  isHighValue: false,
  isOverweight: false,
  isOversize: false,
  isBonded: false,
  isPerishable: false,
  needsExtraMan: false,
  needsTempControl: false,
  insidePickup: false,
  insideDelivery: false,
  liftgatePickup: false,
  liftgateDelivery: false,
  residentialPickup: false,
  residentialDelivery: false,
  appointmentAtPickup: false,
  appointmentAtDelivery: false,
};

function dateToInputValue(value: unknown): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : (value as Date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/** Raw prisma DomesticWarehouseQuote row -> form values, for the edit page. */
export function quoteToFormValues(quote: Record<string, unknown> | null | undefined): QuoteFormValues {
  if (!quote) return { ...EMPTY_QUOTE_FORM_VALUES };
  const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  const bool = (v: unknown) => v === true;
  return {
    customerId: (quote.customerId as string | null) ?? null,
    contactName: str(quote.contactName),
    contactEmail: str(quote.contactEmail),
    contactPhone: str(quote.contactPhone),

    pickupLocation: str(quote.pickupLocation),
    dischargeLocation: str(quote.dischargeLocation),
    finalDestination: str(quote.finalDestination),
    incoTerms: str(quote.incoTerms),
    incoTermsLocation: str(quote.incoTermsLocation),

    effectiveDate: dateToInputValue(quote.effectiveDate),
    expirationDate: dateToInputValue(quote.expirationDate),
    quotedBy: str(quote.quotedBy),
    salesRep: str(quote.salesRep),

    carrierId: (quote.carrierId as string | null) ?? null,
    voyageVessel: str(quote.voyageVessel),

    paymentTerms: str(quote.paymentTerms),
    transitTime: str(quote.transitTime),

    quotedAmount:
      quote.quotedAmountCents === null || quote.quotedAmountCents === undefined
        ? ""
        : (Number(quote.quotedAmountCents) / 100).toString(),
    status: str(quote.status) || "DRAFT",

    isHazardous: bool(quote.isHazardous),
    isHighValue: bool(quote.isHighValue),
    isOverweight: bool(quote.isOverweight),
    isOversize: bool(quote.isOversize),
    isBonded: bool(quote.isBonded),
    isPerishable: bool(quote.isPerishable),
    needsExtraMan: bool(quote.needsExtraMan),
    needsTempControl: bool(quote.needsTempControl),
    insidePickup: bool(quote.insidePickup),
    insideDelivery: bool(quote.insideDelivery),
    liftgatePickup: bool(quote.liftgatePickup),
    liftgateDelivery: bool(quote.liftgateDelivery),
    residentialPickup: bool(quote.residentialPickup),
    residentialDelivery: bool(quote.residentialDelivery),
    appointmentAtPickup: bool(quote.appointmentAtPickup),
    appointmentAtDelivery: bool(quote.appointmentAtDelivery),
  };
}

function sharedBody(values: QuoteFormValues) {
  const flags: Record<AccessorialFlagField, boolean> = {} as Record<AccessorialFlagField, boolean>;
  for (const { field } of ACCESSORIAL_FLAGS) flags[field] = values[field];

  return {
    customerId: values.customerId || null,
    contactName: values.contactName || null,
    contactEmail: values.contactEmail || null,
    contactPhone: values.contactPhone || null,

    pickupLocation: values.pickupLocation || null,
    dischargeLocation: values.dischargeLocation || null,
    finalDestination: values.finalDestination || null,
    incoTerms: values.incoTerms || null,
    incoTermsLocation: values.incoTermsLocation || null,

    effectiveDate: values.effectiveDate || null,
    expirationDate: values.expirationDate || null,
    quotedBy: values.quotedBy || null,
    salesRep: values.salesRep || null,

    carrierId: values.carrierId || null,
    voyageVessel: values.voyageVessel || null,

    paymentTerms: values.paymentTerms || null,
    transitTime: values.transitTime || null,

    quotedAmount: values.quotedAmount || null,
    status: values.status || "DRAFT",

    ...flags,
  };
}

/** Form values -> POST /api/quotes request body. */
export function quoteFormValuesToCreateBody(values: QuoteFormValues) {
  return sharedBody(values);
}

/** Form values -> PATCH /api/quotes/[id] request body. */
export function quoteFormValuesToPatchBody(values: QuoteFormValues) {
  return sharedBody(values);
}

export interface QuoteFormProps {
  values: QuoteFormValues;
  onChange: (values: QuoteFormValues) => void;
  disabled?: boolean;
}

const inputClass =
  "w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm focus:border-zinc-500 focus:outline-none disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-brand dark:disabled:bg-zinc-800";
const labelClass = "block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1";
const sectionTitleClass = "text-sm font-semibold text-zinc-700 dark:text-zinc-300";

export default function QuoteForm({ values, onChange, disabled }: QuoteFormProps) {
  function set<K extends keyof QuoteFormValues>(key: K, value: QuoteFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className={sectionTitleClass}>Customer &amp; Contact</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ClientLookupField
            label="Customer (Account)"
            role="ACCOUNT"
            value={values.customerId}
            onChange={(id) => set("customerId", id)}
            disabled={disabled}
          />
          <div>
            <label className={labelClass}>Contact Name</label>
            <input className={inputClass} value={values.contactName} disabled={disabled} onChange={(e) => set("contactName", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Contact Email</label>
            <input
              type="email"
              className={inputClass}
              value={values.contactEmail}
              disabled={disabled}
              onChange={(e) => set("contactEmail", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Contact Phone</label>
            <input className={inputClass} value={values.contactPhone} disabled={disabled} onChange={(e) => set("contactPhone", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <h2 className={sectionTitleClass}>Routing</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <LocationLookupField
            label="Pickup Location"
            value={values.pickupLocation}
            onChange={(v) => set("pickupLocation", v)}
            disabled={disabled}
          />
          <LocationLookupField
            label="Discharge Location"
            value={values.dischargeLocation}
            onChange={(v) => set("dischargeLocation", v)}
            disabled={disabled}
          />
          <LocationLookupField
            label="Final Destination"
            value={values.finalDestination}
            onChange={(v) => set("finalDestination", v)}
            disabled={disabled}
          />
          <div>
            <label className={labelClass}>Transit Time</label>
            <input className={inputClass} value={values.transitTime} disabled={disabled} onChange={(e) => set("transitTime", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Incoterms</label>
            <select className={inputClass} value={values.incoTerms} disabled={disabled} onChange={(e) => set("incoTerms", e.target.value)}>
              <option value="">&mdash;</option>
              {toOptions(INCOTERMS_LABELS).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Incoterms Location</label>
            <input
              className={inputClass}
              value={values.incoTermsLocation}
              disabled={disabled}
              onChange={(e) => set("incoTermsLocation", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <h2 className={sectionTitleClass}>Quote Details</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelClass}>Effective Date</label>
            <input
              type="date"
              className={inputClass}
              value={values.effectiveDate}
              disabled={disabled}
              onChange={(e) => set("effectiveDate", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Expiration Date</label>
            <input
              type="date"
              className={inputClass}
              value={values.expirationDate}
              disabled={disabled}
              onChange={(e) => set("expirationDate", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Quoted By</label>
            <input className={inputClass} value={values.quotedBy} disabled={disabled} onChange={(e) => set("quotedBy", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Sales Rep</label>
            <input className={inputClass} value={values.salesRep} disabled={disabled} onChange={(e) => set("salesRep", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Quoted Amount ($)</label>
            <input
              className={inputClass}
              value={values.quotedAmount}
              disabled={disabled}
              placeholder="0.00"
              onChange={(e) => set("quotedAmount", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Payment Terms</label>
            <input className={inputClass} value={values.paymentTerms} disabled={disabled} onChange={(e) => set("paymentTerms", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select className={inputClass} value={values.status} disabled={disabled} onChange={(e) => set("status", e.target.value)}>
              {QUOTE_STATUS_VALUES.map((s) => (
                <option key={s} value={s}>
                  {QUOTE_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <h2 className={sectionTitleClass}>Carrier</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ClientLookupField
            label="Carrier"
            role="CARRIER"
            value={values.carrierId}
            onChange={(id) => set("carrierId", id)}
            disabled={disabled}
          />
          <div>
            <label className={labelClass}>Voyage / Vessel</label>
            <input className={inputClass} value={values.voyageVessel} disabled={disabled} onChange={(e) => set("voyageVessel", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <h2 className={sectionTitleClass}>Accessorials</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
          {ACCESSORIAL_FLAGS.map(({ field, label }) => (
            <label key={field} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={values[field]}
                disabled={disabled}
                onChange={(e) => set(field, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
