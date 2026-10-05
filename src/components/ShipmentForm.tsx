"use client";

import { useState, type ReactNode, type SubmitEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ClientLookupField from "@/components/ClientLookupField";
import LocationLookupField from "@/components/LocationLookupField";
import {
  DOMESTIC_TYPE_LABELS,
  INCOTERMS_LABELS,
  TYPE_OF_SERVICE_LABELS,
  PAYMENT_METHOD_LABELS,
  SHIPMENT_STATUS_LABELS,
  toOptions,
} from "@/lib/enumLabels";

/**
 * Shared field-set for creating/editing a DomesticWarehouseShipment. Used by both
 * /shipments/new/form (create mode) and /shipments/[fileNumber] (edit mode) so the
 * markup and request-body shaping only exists once. The component owns its own
 * fetch/submit logic (POST for create, PATCH for edit) — the caller only supplies the
 * starting values and, in edit mode, the fileNumber.
 */
export interface ShipmentFormValues {
  domesticType: string;
  status: string;
  accountId: string | null;
  shipperId: string | null;
  consigneeId: string | null;
  notifyPartyId: string | null;
  soldToId: string | null;
  shipToId: string | null;
  carrierId: string | null;
  placeOfReceipt: string;
  origin: string;
  destination: string;
  country: string;
  placeOfDelivery: string;
  incoTerms: string;
  proNumber: string;
  bolNumber: string;
  typeOfService: string;
  otherReference: string;
  paymentMethod: string;
  transitStartAt: string;
  transitEndAt: string;
  shipAt: string;
  cutoffAt: string;
  etaAt: string;
  atdAt: string;
  cargoDescription: string;
  insurance: string;
  insuranceValue: string;
  codFee: string;
  dryRun: string;
  totalCharges: string;
  serviceLevel: string;
}

export const EMPTY_SHIPMENT_FORM_VALUES: ShipmentFormValues = {
  domesticType: "",
  status: "SCHEDULED",
  accountId: null,
  shipperId: null,
  consigneeId: null,
  notifyPartyId: null,
  soldToId: null,
  shipToId: null,
  carrierId: null,
  placeOfReceipt: "",
  origin: "",
  destination: "",
  country: "",
  placeOfDelivery: "",
  incoTerms: "",
  proNumber: "",
  bolNumber: "",
  typeOfService: "",
  otherReference: "",
  paymentMethod: "",
  transitStartAt: "",
  transitEndAt: "",
  shipAt: "",
  cutoffAt: "",
  etaAt: "",
  atdAt: "",
  cargoDescription: "",
  insurance: "",
  insuranceValue: "",
  codFee: "",
  dryRun: "",
  totalCharges: "",
  serviceLevel: "",
};

function toDatetimeLocal(value: unknown): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function centsToDollarString(cents: unknown): string {
  if (cents === null || cents === undefined) return "";
  return (Number(cents) / 100).toFixed(2);
}

/** Any DomesticWarehouseShipment-shaped record (e.g. the raw prisma row from the GET route) -> form values. */
export function shipmentToFormValues(record: Record<string, unknown> | null | undefined): ShipmentFormValues {
  if (!record) return { ...EMPTY_SHIPMENT_FORM_VALUES };
  const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  const idOrNull = (v: unknown) => (typeof v === "string" ? v : null);
  return {
    domesticType: str(record.domesticType),
    status: str(record.status) || "SCHEDULED",
    accountId: idOrNull(record.accountId),
    shipperId: idOrNull(record.shipperId),
    consigneeId: idOrNull(record.consigneeId),
    notifyPartyId: idOrNull(record.notifyPartyId),
    soldToId: idOrNull(record.soldToId),
    shipToId: idOrNull(record.shipToId),
    carrierId: idOrNull(record.carrierId),
    placeOfReceipt: str(record.placeOfReceipt),
    origin: str(record.origin),
    destination: str(record.destination),
    country: str(record.country),
    placeOfDelivery: str(record.placeOfDelivery),
    incoTerms: str(record.incoTerms),
    proNumber: str(record.proNumber),
    bolNumber: str(record.bolNumber),
    typeOfService: str(record.typeOfService),
    otherReference: str(record.otherReference),
    paymentMethod: str(record.paymentMethod),
    transitStartAt: toDatetimeLocal(record.transitStartAt),
    transitEndAt: toDatetimeLocal(record.transitEndAt),
    shipAt: toDatetimeLocal(record.shipAt),
    cutoffAt: toDatetimeLocal(record.cutoffAt),
    etaAt: toDatetimeLocal(record.etaAt),
    atdAt: toDatetimeLocal(record.atdAt),
    cargoDescription: str(record.cargoDescription),
    insurance: str(record.insurance),
    insuranceValue: centsToDollarString(record.insuranceValueCents),
    codFee: centsToDollarString(record.codFeeCents),
    dryRun: str(record.dryRun),
    totalCharges: centsToDollarString(record.totalChargesCents),
    serviceLevel: str(record.serviceLevel),
  };
}

function dateOrNull(v: string): string | null {
  return v ? new Date(v).toISOString() : null;
}

function orNull(v: string): string | null {
  return v.trim() ? v : null;
}

/** Shapes ShipmentFormValues into the request body for both POST /api/shipments and PATCH /api/shipments/[fileNumber] — the API route is the source of truth for which fields it actually persists per method. */
export function shipmentFormValuesToBody(values: ShipmentFormValues): Record<string, unknown> {
  return {
    domesticType: orNull(values.domesticType),
    status: orNull(values.status),
    accountId: values.accountId,
    shipperId: values.shipperId,
    consigneeId: values.consigneeId,
    notifyPartyId: values.notifyPartyId,
    soldToId: values.soldToId,
    shipToId: values.shipToId,
    carrierId: values.carrierId,
    placeOfReceipt: orNull(values.placeOfReceipt),
    origin: orNull(values.origin),
    destination: orNull(values.destination),
    country: orNull(values.country),
    placeOfDelivery: orNull(values.placeOfDelivery),
    incoTerms: orNull(values.incoTerms),
    proNumber: orNull(values.proNumber),
    bolNumber: orNull(values.bolNumber),
    typeOfService: orNull(values.typeOfService),
    otherReference: orNull(values.otherReference),
    paymentMethod: orNull(values.paymentMethod),
    transitStartAt: dateOrNull(values.transitStartAt),
    transitEndAt: dateOrNull(values.transitEndAt),
    shipAt: dateOrNull(values.shipAt),
    cutoffAt: dateOrNull(values.cutoffAt),
    etaAt: dateOrNull(values.etaAt),
    atdAt: dateOrNull(values.atdAt),
    cargoDescription: orNull(values.cargoDescription),
    insurance: orNull(values.insurance),
    insuranceValue: orNull(values.insuranceValue),
    codFee: orNull(values.codFee),
    dryRun: orNull(values.dryRun),
    totalCharges: orNull(values.totalCharges),
    serviceLevel: orNull(values.serviceLevel),
  };
}

function nowDatetimeLocal(): string {
  return toDatetimeLocal(new Date());
}

export interface ShipmentFormProps {
  mode: "create" | "edit";
  /** Required in edit mode: identifies the record for PATCH and drives the Print/Billing/Cargo/Delivery Order links. */
  fileNumber?: string;
  initialValues: ShipmentFormValues;
  /** Create mode only: true when domesticType was already chosen on the /shipments/new type-picker step. */
  lockDomesticType?: boolean;
}

const fieldLabelClass = "text-xs font-medium text-zinc-600 dark:text-zinc-400";
const inputClass =
  "rounded border border-zinc-300 px-2.5 py-1.5 text-sm focus:border-zinc-500 focus:outline-none disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-brand dark:disabled:bg-zinc-800";

function TextField({
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className={fieldLabelClass}>{label}</span>
      <input
        className={inputClass}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className={fieldLabelClass}>{label}</span>
      <select className={inputClass} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateTimeField({
  label,
  value,
  onChange,
  min,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className={fieldLabelClass}>{label}</span>
      <input
        type="datetime-local"
        className={inputClass}
        value={value}
        min={min}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 border-t border-zinc-200 pt-4 first:border-t-0 first:pt-0 dark:border-zinc-800">
      <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{title}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">{children}</div>
    </section>
  );
}

const actionButtonClass =
  "rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800";

export default function ShipmentForm({ mode, fileNumber, initialValues, lockDomesticType }: ShipmentFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ShipmentFormValues>(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ShipmentFormValues>(key: K, value: ShipmentFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!values.domesticType) {
      setError("Domestic Type is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = shipmentFormValuesToBody(values);
      if (mode === "create") {
        const res = await fetch("/api/shipments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error ?? "Failed to create shipment");
        }
        const { data } = await res.json();
        router.push(`/shipments/${data.fileNumber}`);
      } else {
        if (!fileNumber) throw new Error("Missing fileNumber for edit");
        const res = await fetch(`/api/shipments/${fileNumber}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error ?? "Failed to save shipment");
        }
        const { data } = await res.json();
        setValues(shipmentToFormValues(data));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save shipment");
    } finally {
      setSaving(false);
    }
  }

  const minDatetime = mode === "create" ? nowDatetimeLocal() : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Section title="Identification">
        <label className="flex flex-col gap-1">
          <span className={fieldLabelClass}>File Number</span>
          <input
            className={`${inputClass} bg-zinc-100 font-mono dark:bg-zinc-800`}
            value={fileNumber ?? "(generated on save)"}
            disabled
            readOnly
          />
        </label>
        {mode === "edit" && (
          <SelectField
            label="Status"
            value={values.status}
            onChange={(v) => set("status", v)}
            options={toOptions(SHIPMENT_STATUS_LABELS)}
          />
        )}
        <SelectField
          label="Domestic Type"
          value={values.domesticType}
          onChange={(v) => set("domesticType", v)}
          options={toOptions(DOMESTIC_TYPE_LABELS)}
          disabled={mode === "create" && lockDomesticType}
        />
      </Section>

      <Section title="Parties">
        <ClientLookupField label="Account" role="ACCOUNT" value={values.accountId} onChange={(id) => set("accountId", id)} disabled={saving} />
        <ClientLookupField label="Shipper" role="SHIPPER" value={values.shipperId} onChange={(id) => set("shipperId", id)} disabled={saving} />
        <ClientLookupField label="Consignee" role="CONSIGNEE" value={values.consigneeId} onChange={(id) => set("consigneeId", id)} disabled={saving} />
        <ClientLookupField label="Carrier" role="CARRIER" value={values.carrierId} onChange={(id) => set("carrierId", id)} disabled={saving} />
      </Section>

      <Section title="Routing">
        <LocationLookupField label="Place of Receipt" value={values.placeOfReceipt} onChange={(v) => set("placeOfReceipt", v)} disabled={saving} />
        <LocationLookupField label="Origin" value={values.origin} onChange={(v) => set("origin", v)} disabled={saving} />
        <LocationLookupField label="Destination" value={values.destination} onChange={(v) => set("destination", v)} disabled={saving} />
        <LocationLookupField label="Place of Delivery" value={values.placeOfDelivery} onChange={(v) => set("placeOfDelivery", v)} disabled={saving} />
        <TextField label="Country" value={values.country} onChange={(v) => set("country", v)} disabled={saving} />
      </Section>

      <Section title="Terms & References">
        <SelectField label="Inco Terms" value={values.incoTerms} onChange={(v) => set("incoTerms", v)} options={toOptions(INCOTERMS_LABELS)} disabled={saving} />
        <TextField label="Pro Number" value={values.proNumber} onChange={(v) => set("proNumber", v)} disabled={saving} />
        <TextField label="BOL Number" value={values.bolNumber} onChange={(v) => set("bolNumber", v)} disabled={saving} />
        <SelectField label="Type of Service" value={values.typeOfService} onChange={(v) => set("typeOfService", v)} options={toOptions(TYPE_OF_SERVICE_LABELS)} disabled={saving} />
        <TextField label="Other Reference" value={values.otherReference} onChange={(v) => set("otherReference", v)} disabled={saving} />
        <SelectField label="Payment Method" value={values.paymentMethod} onChange={(v) => set("paymentMethod", v)} options={toOptions(PAYMENT_METHOD_LABELS)} disabled={saving} />
      </Section>

      <Section title="Schedule">
        <DateTimeField label="Transit Start" value={values.transitStartAt} onChange={(v) => set("transitStartAt", v)} min={minDatetime} disabled={saving} />
        <DateTimeField label="Transit End" value={values.transitEndAt} onChange={(v) => set("transitEndAt", v)} min={minDatetime} disabled={saving} />
        <DateTimeField label="Ship At" value={values.shipAt} onChange={(v) => set("shipAt", v)} min={minDatetime} disabled={saving} />
        <DateTimeField label="Cutoff At" value={values.cutoffAt} onChange={(v) => set("cutoffAt", v)} min={minDatetime} disabled={saving} />
        <DateTimeField label="ETA" value={values.etaAt} onChange={(v) => set("etaAt", v)} min={minDatetime} disabled={saving} />
        <DateTimeField label="ATD" value={values.atdAt} onChange={(v) => set("atdAt", v)} min={minDatetime} disabled={saving} />
      </Section>

      <Section title="Cargo & Charges">
        <label className="col-span-full flex flex-col gap-1">
          <span className={fieldLabelClass}>Cargo Description</span>
          <textarea
            className={`${inputClass} min-h-20`}
            value={values.cargoDescription}
            disabled={saving}
            onChange={(e) => set("cargoDescription", e.target.value)}
          />
        </label>
        <TextField label="Insurance" value={values.insurance} onChange={(v) => set("insurance", v)} disabled={saving} />
        <TextField label="Insurance Value ($)" value={values.insuranceValue} onChange={(v) => set("insuranceValue", v)} disabled={saving} placeholder="0.00" />
        <TextField label="COD Fee ($)" value={values.codFee} onChange={(v) => set("codFee", v)} disabled={saving} placeholder="0.00" />
        <label className="col-span-full flex flex-col gap-1">
          <span className={fieldLabelClass}>Dry Run</span>
          <textarea
            className={`${inputClass} min-h-20`}
            value={values.dryRun}
            disabled={saving}
            placeholder={"One quote amount per line, e.g.\n150\n200 - 09/05/2026"}
            onChange={(e) => set("dryRun", e.target.value)}
          />
        </label>
        <TextField label="Total Charges ($)" value={values.totalCharges} onChange={(v) => set("totalCharges", v)} disabled={saving} placeholder="0.00" />
        <TextField label="Service Level" value={values.serviceLevel} onChange={(v) => set("serviceLevel", v)} disabled={saving} />
      </Section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <button type="button" onClick={() => router.push("/shipments")} disabled={saving} className={actionButtonClass}>
          Cancel
        </button>
        {mode === "edit" && fileNumber && (
          <>
            <Link href={`/shipments/${fileNumber}/print`} className={actionButtonClass}>
              Print
            </Link>
            <Link href={`/shipments/${fileNumber}/billing`} className={actionButtonClass}>
              Billing
            </Link>
            <Link href={`/shipments/${fileNumber}/cargo`} className={actionButtonClass}>
              Cargo
            </Link>
            <Link href={`/shipments/${fileNumber}/delivery-orders`} className={actionButtonClass}>
              Delivery Order
            </Link>
            <Link href={`/shipments/${fileNumber}/attachments`} className={actionButtonClass}>
              Attachments
            </Link>
          </>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-brand px-3 py-1.5 text-sm text-white hover:bg-brand-dark disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
