"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import LocationForm, { EMPTY_LOCATION_FORM_VALUES, locationFormValuesToBody, locationToFormValues, type LocationFormValues } from "@/components/LocationForm";
import LoadingOverlay from "@/components/LoadingOverlay";

interface LocationRow {
  id: string;
  code: string | null;
  name: string;
  city: string | null;
  state: string | null;
  country: string | null;
  isActive: boolean;
}

export default function LocationsPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<LocationFormValues>({ ...EMPTY_LOCATION_FORM_VALUES });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newValues, setNewValues] = useState<LocationFormValues>({ ...EMPTY_LOCATION_FORM_VALUES });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: "200" });
      if (q) params.set("q", q);
      const res = await fetch(`/api/locations?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRows(data.items);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const handle = setTimeout(load, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function startEdit(row: LocationRow) {
    setEditingId(row.id);
    setEditValues(locationToFormValues(row));
  }

  async function saveEdit(id: string) {
    setSavingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/locations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(locationFormValuesToBody(editValues)),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save location");
      }
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save location");
    } finally {
      setSavingId(null);
    }
  }

  async function toggleActive(row: LocationRow) {
    setSavingId(row.id);
    try {
      await fetch(`/api/locations/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !row.isActive }),
      });
      await load();
    } finally {
      setSavingId(null);
    }
  }

  async function submitNew(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newValues.name.trim()) {
      setError("Name is required");
      return;
    }
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(locationFormValuesToBody(newValues)),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to create location");
      }
      setNewValues({ ...EMPTY_LOCATION_FORM_VALUES });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create location");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-xl font-semibold">Locations</h1>

      <input
        className="mb-3 w-full max-w-sm rounded border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-brand"
        placeholder="Search by name, city, state, or code..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={submitNew} className="mb-4 rounded border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
        <p className="mb-2 text-xs font-medium text-zinc-500">Add new location</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <LocationForm values={newValues} onChange={setNewValues} layout="inline" disabled={adding} />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="h-fit rounded bg-brand px-3 py-1.5 text-sm text-white hover:bg-brand-dark disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {adding ? "Adding..." : "Add"}
          </button>
        </div>
      </form>

      <div className="relative overflow-auto rounded border border-zinc-200 dark:border-zinc-800">
        <LoadingOverlay show={loading} />
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 text-left font-medium">Code</th>
              <th className="px-3 py-2 text-left font-medium">City</th>
              <th className="px-3 py-2 text-left font-medium">State</th>
              <th className="px-3 py-2 text-left font-medium">Country</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) =>
              editingId === row.id ? (
                <tr key={row.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td colSpan={5} className="px-3 py-2">
                    <LocationForm values={editValues} onChange={setEditValues} layout="inline" disabled={savingId === row.id} />
                  </td>
                  <td className="px-3 py-2 text-zinc-500">{row.isActive ? "Active" : "Inactive"}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => saveEdit(row.id)}
                      disabled={savingId === row.id}
                      className="mr-2 rounded border border-zinc-300 px-2 py-0.5 text-xs hover:bg-zinc-100 dark:border-zinc-700"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded border border-zinc-300 px-2 py-0.5 text-xs hover:bg-zinc-100 dark:border-zinc-700"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={row.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2 text-zinc-500">{row.code}</td>
                  <td className="px-3 py-2 text-zinc-500">{row.city}</td>
                  <td className="px-3 py-2 text-zinc-500">{row.state}</td>
                  <td className="px-3 py-2 text-zinc-500">{row.country}</td>
                  <td className="px-3 py-2">
                    {row.isActive ? (
                      <span className="text-green-700 dark:text-green-500">Active</span>
                    ) : (
                      <span className="text-zinc-400">Inactive</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => startEdit(row)}
                      className="mr-2 rounded border border-zinc-300 px-2 py-0.5 text-xs hover:bg-zinc-100 dark:border-zinc-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleActive(row)}
                      disabled={savingId === row.id}
                      className="rounded border border-zinc-300 px-2 py-0.5 text-xs hover:bg-zinc-100 dark:border-zinc-700"
                    >
                      {row.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              )
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-zinc-500">
                  No locations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
