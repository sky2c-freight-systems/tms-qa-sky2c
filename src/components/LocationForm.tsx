"use client";

/** Shared field-set for creating/editing a Location row. Used by the /locations admin
 * page's inline add/edit rows and by the "+ Add new" modal inside <LocationLookupField>.
 */
export interface LocationFormValues {
  name: string;
  code: string;
  city: string;
  state: string;
  country: string;
}

export const EMPTY_LOCATION_FORM_VALUES: LocationFormValues = {
  name: "",
  code: "",
  city: "",
  state: "",
  country: "",
};

interface LocationLike {
  name?: string | null;
  code?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

export function locationToFormValues(location: LocationLike | null | undefined): LocationFormValues {
  if (!location) return { ...EMPTY_LOCATION_FORM_VALUES };
  const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  return {
    name: str(location.name),
    code: str(location.code),
    city: str(location.city),
    state: str(location.state),
    country: str(location.country),
  };
}

export function locationFormValuesToBody(values: LocationFormValues) {
  return {
    name: values.name.trim(),
    code: values.code || null,
    city: values.city || null,
    state: values.state || null,
    country: values.country || null,
  };
}

export interface LocationFormProps {
  values: LocationFormValues;
  onChange: (values: LocationFormValues) => void;
  disabled?: boolean;
  /** Renders fields inline (for table-row editing) instead of stacked (for a modal). */
  layout?: "stacked" | "inline";
}

const inputClass =
  "w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm focus:border-zinc-500 focus:outline-none disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-brand dark:disabled:bg-zinc-800";
const labelClass = "block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1";

export default function LocationForm({ values, onChange, disabled, layout = "stacked" }: LocationFormProps) {
  function set<K extends keyof LocationFormValues>(key: K, value: LocationFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  const fields = (
    <>
      <div>
        {layout === "stacked" && <label className={labelClass}>Name *</label>}
        <input
          className={inputClass}
          value={values.name}
          disabled={disabled}
          placeholder="Name (e.g. Los Angeles, CA)"
          onChange={(e) => set("name", e.target.value)}
          required
        />
      </div>
      <div>
        {layout === "stacked" && <label className={labelClass}>Code</label>}
        <input
          className={inputClass}
          value={values.code}
          disabled={disabled}
          placeholder="Code"
          onChange={(e) => set("code", e.target.value)}
        />
      </div>
      <div>
        {layout === "stacked" && <label className={labelClass}>City</label>}
        <input
          className={inputClass}
          value={values.city}
          disabled={disabled}
          placeholder="City"
          onChange={(e) => set("city", e.target.value)}
        />
      </div>
      <div>
        {layout === "stacked" && <label className={labelClass}>State</label>}
        <input
          className={inputClass}
          value={values.state}
          disabled={disabled}
          placeholder="State"
          onChange={(e) => set("state", e.target.value)}
        />
      </div>
      <div>
        {layout === "stacked" && <label className={labelClass}>Country</label>}
        <input
          className={inputClass}
          value={values.country}
          disabled={disabled}
          placeholder="Country"
          onChange={(e) => set("country", e.target.value)}
        />
      </div>
    </>
  );

  if (layout === "inline") {
    return <div className="grid grid-cols-5 gap-2">{fields}</div>;
  }
  return <div className="space-y-3">{fields}</div>;
}
