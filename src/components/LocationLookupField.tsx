"use client";

import { useEffect, useRef, useState, type SubmitEvent } from "react";
import LocationForm, { EMPTY_LOCATION_FORM_VALUES, locationFormValuesToBody, type LocationFormValues } from "@/components/LocationForm";

interface LocationSummary {
  id: string;
  name: string;
}

export interface LocationLookupFieldProps {
  label: string;
  value: string; // free text stored directly on the parent record (e.g. Shipment.origin)
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

const fieldButtonClass =
  "rounded border border-zinc-300 px-2 text-sm whitespace-nowrap hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800";

export default function LocationLookupField({ label, value, onChange, required, disabled }: LocationLookupFieldProps) {
  const [suggestions, setSuggestions] = useState<LocationSummary[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value.trim()) {
      // Clearing stale suggestions when the field is emptied is the state this effect
      // synchronizes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestions([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: value, limit: "10" });
        const res = await fetch(`/api/locations/search?${params.toString()}`);
        if (res.ok) setSuggestions(await res.json());
      } catch {
        // ignore
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [value]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(loc: LocationSummary) {
    onChange(loc.name);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative flex gap-1" ref={containerRef}>
        <div className="relative flex-1">
          <input
            className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm focus:border-zinc-500 focus:outline-none disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-brand dark:disabled:bg-zinc-800"
            value={value}
            disabled={disabled}
            placeholder="Type to search or enter free text..."
            onChange={(e) => {
              onChange(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
          />
          {showSuggestions && value.trim() && suggestions.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded border border-zinc-300 bg-white text-sm shadow-lg dark:border-zinc-700 dark:bg-brand">
              {suggestions.map((loc) => (
                <li key={loc.id}>
                  <button
                    type="button"
                    className="block w-full px-2.5 py-1.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    onClick={() => pick(loc)}
                  >
                    {loc.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" title="Search locations" disabled={disabled} onClick={() => setSearchModalOpen(true)} className={fieldButtonClass}>
          Search
        </button>
        <button type="button" title="Add new location" disabled={disabled} onClick={() => setAddModalOpen(true)} className={fieldButtonClass}>
          + Add new
        </button>
      </div>

      {searchModalOpen && (
        <LocationSearchModal
          onClose={() => setSearchModalOpen(false)}
          onPick={(loc) => {
            pick(loc);
            setSearchModalOpen(false);
          }}
        />
      )}

      {addModalOpen && (
        <LocationAddModal
          initialName={value}
          onClose={() => setAddModalOpen(false)}
          onCreated={(loc) => {
            pick(loc);
            setAddModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function ModalShell({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={`w-full ${wide ? "max-w-3xl" : "max-w-lg"} rounded-lg bg-white p-5 shadow-xl dark:bg-brand`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function LocationSearchModal({ onClose, onPick }: { onClose: () => void; onPick: (loc: LocationSummary) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<LocationSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(async () => {
      if (cancelled) return;
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "50" });
        if (q) params.set("q", q);
        const res = await fetch(`/api/locations/search?${params.toString()}`);
        if (res.ok && !cancelled) setResults(await res.json());
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [q]);

  return (
    <ModalShell title="Search Locations" onClose={onClose} wide>
      <input
        autoFocus
        className="mb-3 w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-brand"
        placeholder="Search by name, city, or state..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="max-h-96 overflow-auto rounded border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {results.map((loc) => (
              <tr key={loc.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-3 py-2">{loc.name}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onPick(loc)}
                    className="rounded border border-zinc-300 px-2 py-0.5 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-brand-dark"
                  >
                    Select
                  </button>
                </td>
              </tr>
            ))}
            {!loading && results.length === 0 && (
              <tr>
                <td colSpan={2} className="px-3 py-4 text-center text-zinc-500">
                  No locations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ModalShell>
  );
}

function LocationAddModal({
  initialName,
  onClose,
  onCreated,
}: {
  initialName?: string;
  onClose: () => void;
  onCreated: (loc: LocationSummary) => void;
}) {
  const [values, setValues] = useState<LocationFormValues>({ ...EMPTY_LOCATION_FORM_VALUES, name: initialName ?? "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!values.name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(locationFormValuesToBody(values)),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to create location");
      }
      const loc = await res.json();
      onCreated({ id: loc.id, name: loc.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create location");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Add New Location" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <LocationForm values={values} onChange={setValues} disabled={saving} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-brand px-3 py-1.5 text-sm text-white hover:bg-brand-dark disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {saving ? "Saving..." : "Create Location"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
