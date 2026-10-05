"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import QuoteForm, {
  EMPTY_QUOTE_FORM_VALUES,
  quoteFormValuesToCreateBody,
  type QuoteFormValues,
} from "@/components/QuoteForm";

export default function NewQuotePage() {
  const router = useRouter();
  const [values, setValues] = useState<QuoteFormValues>({ ...EMPTY_QUOTE_FORM_VALUES });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quoteFormValuesToCreateBody(values)),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to create quote");
      }
      const quote = await res.json();
      router.push(`/quotes/${quote.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create quote");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">New Quote</h1>
        <span className="text-xs text-zinc-500">Quote # is assigned automatically on save</span>
      </div>

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
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-brand px-3 py-1.5 text-sm text-white hover:bg-brand-dark disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {saving ? "Saving..." : "Create Quote"}
          </button>
        </div>
      </form>
      <p className="mt-2 text-xs text-zinc-500">Cargo line items and the printable quote can be added after the quote is created.</p>
    </div>
  );
}
