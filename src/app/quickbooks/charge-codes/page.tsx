"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Spinner from "@/components/Spinner";

/** Reserved ChargeCodeQboItemMap key — must match DEFAULT_QBO_ITEM_KEY in src/lib/qbo.ts. */
const DEFAULT_QBO_ITEM_KEY = "DEFAULT";

interface ChargeCodeMapRow {
  id: string;
  chargeCode: string;
  qboItemId: string;
  qboItemName: string | null;
  isActive: boolean;
}

interface QboItemOption {
  id: string;
  name: string;
}

export default function ChargeCodesPage() {
  const [defaultRow, setDefaultRow] = useState<ChargeCodeMapRow | null>(null);
  const [items, setItems] = useState<QboItemOption[]>([]);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedItemId, setSelectedItemId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function loadAll() {
    setError(null);
    try {
      const [rowsRes, itemsRes] = await Promise.all([
        fetch("/api/quickbooks/charge-codes"),
        fetch("/api/quickbooks/items"),
      ]);

      const rowsData = await rowsRes.json().catch(() => null);
      if (!rowsRes.ok) {
        setError(rowsData?.error ?? "Failed to load mapping");
      } else {
        const rows = (rowsData?.rows ?? []) as ChargeCodeMapRow[];
        const row = rows.find((r) => r.chargeCode === DEFAULT_QBO_ITEM_KEY) ?? null;
        setDefaultRow(row);
        setSelectedItemId(row?.qboItemId ?? "");
      }

      const itemsData = await itemsRes.json().catch(() => null);
      if (!itemsRes.ok) {
        setItemsError(itemsData?.error ?? "Failed to load QuickBooks items");
      } else {
        setItems(itemsData?.items ?? []);
      }
    } catch {
      setError("Something went wrong loading the current setting.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const handle = setTimeout(loadAll, 0);
    return () => clearTimeout(handle);
  }, []);

  async function handleSave() {
    if (!selectedItemId) return;
    setIsSaving(true);
    setError(null);
    try {
      const chosen = items.find((i) => i.id === selectedItemId);
      const body = { qboItemId: selectedItemId, qboItemName: chosen?.name };

      const res = defaultRow
        ? await fetch(`/api/quickbooks/charge-codes/${defaultRow.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...body, isActive: true }),
          })
        : await fetch("/api/quickbooks/charge-codes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chargeCode: DEFAULT_QBO_ITEM_KEY, ...body }),
          });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Failed to save setting");
        return;
      }
      await loadAll();
    } catch {
      setError("Something went wrong saving the setting.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <Link href="/quickbooks" className="text-sm text-blue-600 hover:underline">
        &larr; Back to QuickBooks
      </Link>

      <h1 className="mb-1 mt-4 text-xl font-semibold text-gray-900">
        Default Invoice Product/Service
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        Every invoice line item synced to QuickBooks posts to this single
        Product/Service (e.g. &quot;Trucking&quot;), regardless of the
        invoice&apos;s charge code. Pick it from the connected company&apos;s
        live QuickBooks items below. Nothing syncs until this is set.
      </p>

      {error ? (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="flex items-center gap-2 text-sm text-gray-500">
          <Spinner className="h-4 w-4 text-brand" />
          Loading...
        </p>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          {defaultRow ? (
            <p className="mb-4 text-sm text-gray-700">
              Currently set to{" "}
              <span className="font-medium text-gray-900">
                {defaultRow.qboItemName ?? defaultRow.qboItemId}
              </span>{" "}
              (id {defaultRow.qboItemId}){" "}
              {defaultRow.isActive ? (
                <span className="text-green-700">— active</span>
              ) : (
                <span className="text-red-600">— inactive (sync will fail)</span>
              )}
            </p>
          ) : (
            <p className="mb-4 text-sm text-amber-700">
              Not set yet — invoice sync will fail until you choose an item below.
            </p>
          )}

          {itemsError ? (
            <p className="mb-3 text-sm text-red-700">
              Couldn&apos;t load live QuickBooks items: {itemsError}
            </p>
          ) : (
            <div className="mb-3 flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  QuickBooks Product/Service
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-64 rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                >
                  <option value="">Select an item&hellip;</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !selectedItemId}
                className="rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
