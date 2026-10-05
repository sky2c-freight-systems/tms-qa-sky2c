"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import LoadingOverlay from "@/components/LoadingOverlay";

const CATEGORIES = ["CLIENT_TYPE", "CONTAINER_TYPE", "PIECE_TYPE", "CHARGE_CODE", "CURRENCY"] as const;
type Category = (typeof CATEGORIES)[number];

interface LookupRow {
  id: string;
  category: string;
  value: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

const emptyNew = { value: "", label: "", sortOrder: "0" };

export default function LookupsPage() {
  const [category, setCategory] = useState<Category>("CLIENT_TYPE");
  const [rows, setRows] = useState<LookupRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<{ value: string; label: string; sortOrder: string }>(emptyNew);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newRow, setNewRow] = useState(emptyNew);
  const [adding, setAdding] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/lookups?category=${category}&includeInactive=true`);
      if (res.ok) setRows(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Resetting the in-progress add/edit rows and loading the newly selected category's
    // values is the intended effect of switching tabs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    setNewRow(emptyNew);
    setEditingId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  function startEdit(row: LookupRow) {
    setEditingId(row.id);
    setEditRow({ value: row.value, label: row.label, sortOrder: String(row.sortOrder) });
  }

  async function saveEdit(id: string) {
    setSavingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/lookups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: editRow.value.trim(),
          label: editRow.label.trim(),
          sortOrder: Number(editRow.sortOrder) || 0,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save");
      }
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingId(null);
    }
  }

  async function toggleActive(row: LookupRow) {
    setSavingId(row.id);
    try {
      if (row.isActive) {
        await fetch(`/api/lookups/${row.id}`, { method: "DELETE" });
      } else {
        await fetch(`/api/lookups/${row.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: true }),
        });
      }
      await load();
    } finally {
      setSavingId(null);
    }
  }

  async function submitNew(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newRow.value.trim() || !newRow.label.trim()) {
      setError("Value and label are required");
      return;
    }
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/lookups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          value: newRow.value.trim(),
          label: newRow.label.trim(),
          sortOrder: Number(newRow.sortOrder) || 0,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to create lookup value");
      }
      setNewRow(emptyNew);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create lookup value");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-xl font-semibold">Lookup Values</h1>

      <div className="mb-4 flex flex-wrap gap-1.5 border-b border-zinc-200 pb-2 dark:border-zinc-800">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`rounded px-3 py-1.5 text-sm ${
              category === cat
                ? "bg-brand text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {cat.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={submitNew} className="mb-4 flex flex-col gap-2 rounded border border-dashed border-zinc-300 p-3 sm:flex-row sm:items-end dark:border-zinc-700">
        <div className="grid flex-1 grid-cols-3 gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Value (key)</label>
            <input
              className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-brand"
              value={newRow.value}
              onChange={(e) => setNewRow({ ...newRow, value: e.target.value })}
              disabled={adding}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Label</label>
            <input
              className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-brand"
              value={newRow.label}
              onChange={(e) => setNewRow({ ...newRow, label: e.target.value })}
              disabled={adding}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Sort Order</label>
            <input
              type="number"
              className="w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-brand"
              value={newRow.sortOrder}
              onChange={(e) => setNewRow({ ...newRow, sortOrder: e.target.value })}
              disabled={adding}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={adding}
          className="h-fit rounded bg-brand px-3 py-1.5 text-sm text-white hover:bg-brand-dark disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {adding ? "Adding..." : "Add"}
        </button>
      </form>

      <div className="relative overflow-auto rounded border border-zinc-200 dark:border-zinc-800">
        <LoadingOverlay show={loading} />
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Value</th>
              <th className="px-3 py-2 text-left font-medium">Label</th>
              <th className="px-3 py-2 text-left font-medium">Sort</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) =>
              editingId === row.id ? (
                <tr key={row.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-3 py-2">
                    <input
                      className="w-full rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-brand"
                      value={editRow.value}
                      onChange={(e) => setEditRow({ ...editRow, value: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="w-full rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-brand"
                      value={editRow.label}
                      onChange={(e) => setEditRow({ ...editRow, label: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-brand"
                      value={editRow.sortOrder}
                      onChange={(e) => setEditRow({ ...editRow, sortOrder: e.target.value })}
                    />
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
                  <td className="px-3 py-2 font-mono text-xs">{row.value}</td>
                  <td className="px-3 py-2">{row.label}</td>
                  <td className="px-3 py-2 text-zinc-500">{row.sortOrder}</td>
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
                <td colSpan={5} className="px-3 py-6 text-center text-zinc-500">
                  No values in this category yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
