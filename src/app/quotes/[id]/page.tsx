"use client";

import { useEffect, useMemo, useState, type SubmitEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import QuoteForm, {
  EMPTY_QUOTE_FORM_VALUES,
  quoteToFormValues,
  quoteFormValuesToPatchBody,
  type QuoteFormValues,
} from "@/components/QuoteForm";

interface CargoItemDto {
  id: string;
  description: string | null;
  numberOfPieces: number | null;
  pieceType: string | null;
  grossWeightLbs: number | null;
  grossSizeCft: number | null;
  declaredValueCents: number | null;
}

interface CargoItemRow {
  id: string;
  description: string;
  numberOfPieces: string;
  pieceType: string;
  grossWeightLbs: string;
  grossSizeCft: string;
  declaredValue: string;
  saving?: boolean;
}

const EMPTY_NEW_ITEM = {
  description: "",
  numberOfPieces: "",
  pieceType: "",
  grossWeightLbs: "",
  grossSizeCft: "",
  declaredValue: "",
};

function cargoItemToRow(item: CargoItemDto): CargoItemRow {
  return {
    id: item.id,
    description: item.description ?? "",
    numberOfPieces: item.numberOfPieces != null ? String(item.numberOfPieces) : "",
    pieceType: item.pieceType ?? "",
    grossWeightLbs: item.grossWeightLbs != null ? String(item.grossWeightLbs) : "",
    grossSizeCft: item.grossSizeCft != null ? String(item.grossSizeCft) : "",
    declaredValue: item.declaredValueCents != null ? (item.declaredValueCents / 100).toString() : "",
  };
}

function cargoItemRowToBody(row: { description: string; numberOfPieces: string; pieceType: string; grossWeightLbs: string; grossSizeCft: string; declaredValue: string }) {
  return {
    description: row.description || null,
    numberOfPieces: row.numberOfPieces ? Number(row.numberOfPieces) : null,
    pieceType: row.pieceType || null,
    grossWeightLbs: row.grossWeightLbs ? Number(row.grossWeightLbs) : null,
    grossSizeCft: row.grossSizeCft ? Number(row.grossSizeCft) : null,
    declaredValue: row.declaredValue || null,
  };
}

const inputClass =
  "w-full rounded border border-zinc-300 px-2 py-1 text-sm focus:border-zinc-500 focus:outline-none disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-brand dark:disabled:bg-zinc-800";

export default function QuoteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const quoteId = params.id;

  const [values, setValues] = useState<QuoteFormValues>({ ...EMPTY_QUOTE_FORM_VALUES });
  const [quoteNumber, setQuoteNumber] = useState<number | null>(null);
  const [convertedToFileNumber, setConvertedToFileNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [cargoRows, setCargoRows] = useState<CargoItemRow[]>([]);
  const [newItem, setNewItem] = useState({ ...EMPTY_NEW_ITEM });
  const [addingItem, setAddingItem] = useState(false);
  const [cargoError, setCargoError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/quotes/${quoteId}`);
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error("Failed to load quote");
        const quote = await res.json();
        if (!cancelled) {
          setValues(quoteToFormValues(quote));
          setQuoteNumber(quote.quoteNumber);
          setConvertedToFileNumber(quote.convertedToFileNumber ?? null);
        }

        const itemsRes = await fetch(`/api/quotes/${quoteId}/cargo-items`);
        if (itemsRes.ok && !cancelled) {
          const items: CargoItemDto[] = await itemsRes.json();
          setCargoRows(items.map(cargoItemToRow));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load quote");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [quoteId]);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quoteFormValuesToPatchBody(values)),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save quote");
      }
      const quote = await res.json();
      setValues(quoteToFormValues(quote));
      setQuoteNumber(quote.quoteNumber);
      setConvertedToFileNumber(quote.convertedToFileNumber ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save quote");
    } finally {
      setSaving(false);
    }
  }

  function updateRow(id: string, patch: Partial<CargoItemRow>) {
    setCargoRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function saveRow(id: string) {
    const row = cargoRows.find((r) => r.id === id);
    if (!row) return;
    updateRow(id, { saving: true });
    setCargoError(null);
    try {
      const res = await fetch(`/api/quote-cargo-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cargoItemRowToBody(row)),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save cargo item");
      }
      const item: CargoItemDto = await res.json();
      updateRow(id, { ...cargoItemToRow(item), saving: false });
    } catch (err) {
      setCargoError(err instanceof Error ? err.message : "Failed to save cargo item");
      updateRow(id, { saving: false });
    }
  }

  async function deleteRow(id: string) {
    setCargoError(null);
    try {
      const res = await fetch(`/api/quote-cargo-items/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to delete cargo item");
      }
      setCargoRows((rows) => rows.filter((r) => r.id !== id));
    } catch (err) {
      setCargoError(err instanceof Error ? err.message : "Failed to delete cargo item");
    }
  }

  async function handleAddItem(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddingItem(true);
    setCargoError(null);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/cargo-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cargoItemRowToBody(newItem)),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to add cargo item");
      }
      const item: CargoItemDto = await res.json();
      setCargoRows((rows) => [...rows, cargoItemToRow(item)]);
      setNewItem({ ...EMPTY_NEW_ITEM });
    } catch (err) {
      setCargoError(err instanceof Error ? err.message : "Failed to add cargo item");
    } finally {
      setAddingItem(false);
    }
  }

  const htmlUrl = useMemo(() => `/api/quotes/${quoteId}/print?format=html`, [quoteId]);
  const pdfUrl = useMemo(() => `/api/quotes/${quoteId}/print?format=pdf`, [quoteId]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <p className="text-sm text-zinc-500">Quote not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Edit Quote</h1>
        <div className="text-right text-xs text-zinc-500">
          {quoteNumber != null && <div className="font-mono">Quote #{quoteNumber}</div>}
          {convertedToFileNumber && <div>Converted to File #{convertedToFileNumber}</div>}
        </div>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-zinc-500">
          <Spinner className="h-4 w-4 text-brand" />
          Loading...
        </p>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-4">
            <QuoteForm values={values} onChange={setValues} disabled={saving} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => router.push("/quotes")}
                disabled={saving}
                className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
              >
                Back to Quotes
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded bg-brand px-3 py-1.5 text-sm text-white hover:bg-brand-dark disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>

          <div className="mt-8 space-y-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Cargo Line Items</h2>
            {cargoError && <p className="text-sm text-red-600">{cargoError}</p>}
            <div className="overflow-auto rounded border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium">Description</th>
                    <th className="px-2 py-2 text-left font-medium">Pieces</th>
                    <th className="px-2 py-2 text-left font-medium">Piece Type</th>
                    <th className="px-2 py-2 text-left font-medium">Weight (lbs)</th>
                    <th className="px-2 py-2 text-left font-medium">Size (cft)</th>
                    <th className="px-2 py-2 text-left font-medium">Declared Value ($)</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {cargoRows.map((row) => (
                    <tr key={row.id} className="border-t border-zinc-100 dark:border-zinc-800">
                      <td className="px-2 py-1.5">
                        <input
                          className={inputClass}
                          value={row.description}
                          disabled={row.saving}
                          onChange={(e) => updateRow(row.id, { description: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          className={inputClass}
                          value={row.numberOfPieces}
                          disabled={row.saving}
                          onChange={(e) => updateRow(row.id, { numberOfPieces: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          className={inputClass}
                          value={row.pieceType}
                          disabled={row.saving}
                          onChange={(e) => updateRow(row.id, { pieceType: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          className={inputClass}
                          value={row.grossWeightLbs}
                          disabled={row.saving}
                          onChange={(e) => updateRow(row.id, { grossWeightLbs: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          className={inputClass}
                          value={row.grossSizeCft}
                          disabled={row.saving}
                          onChange={(e) => updateRow(row.id, { grossSizeCft: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          className={inputClass}
                          value={row.declaredValue}
                          disabled={row.saving}
                          onChange={(e) => updateRow(row.id, { declaredValue: e.target.value })}
                        />
                      </td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-right">
                        <button
                          type="button"
                          disabled={row.saving}
                          onClick={() => saveRow(row.id)}
                          className="mr-1 rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          disabled={row.saving}
                          onClick={() => deleteRow(row.id)}
                          className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-red-950"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {cargoRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-2 py-3 text-center text-zinc-500">
                        No cargo line items yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <form onSubmit={handleAddItem} className="rounded border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
              <div className="mb-2 text-xs font-medium text-zinc-500">Add cargo line item</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                <input
                  className={inputClass}
                  placeholder="Description"
                  value={newItem.description}
                  disabled={addingItem}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                />
                <input
                  className={inputClass}
                  placeholder="Pieces"
                  value={newItem.numberOfPieces}
                  disabled={addingItem}
                  onChange={(e) => setNewItem({ ...newItem, numberOfPieces: e.target.value })}
                />
                <input
                  className={inputClass}
                  placeholder="Piece Type"
                  value={newItem.pieceType}
                  disabled={addingItem}
                  onChange={(e) => setNewItem({ ...newItem, pieceType: e.target.value })}
                />
                <input
                  className={inputClass}
                  placeholder="Weight (lbs)"
                  value={newItem.grossWeightLbs}
                  disabled={addingItem}
                  onChange={(e) => setNewItem({ ...newItem, grossWeightLbs: e.target.value })}
                />
                <input
                  className={inputClass}
                  placeholder="Size (cft)"
                  value={newItem.grossSizeCft}
                  disabled={addingItem}
                  onChange={(e) => setNewItem({ ...newItem, grossSizeCft: e.target.value })}
                />
                <input
                  className={inputClass}
                  placeholder="Declared Value ($)"
                  value={newItem.declaredValue}
                  disabled={addingItem}
                  onChange={(e) => setNewItem({ ...newItem, declaredValue: e.target.value })}
                />
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={addingItem}
                  className="rounded bg-brand px-3 py-1.5 text-xs text-white hover:bg-brand-dark disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {addingItem ? "Adding..." : "+ Add Item"}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-8 space-y-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Print Quote</h2>
            <iframe
              key={htmlUrl}
              src={htmlUrl}
              title="Quote preview"
              className="h-[640px] w-full rounded border border-zinc-300 bg-white dark:border-zinc-700"
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => window.open(pdfUrl, "_blank", "noopener,noreferrer")}
                className="rounded border border-brand bg-brand px-3 py-1.5 text-sm text-white hover:bg-brand-dark dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
              >
                Print
              </button>
              <a
                href={pdfUrl}
                download={quoteNumber != null ? `quote_${quoteNumber}.pdf` : "quote.pdf"}
                className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Save as PDF
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
