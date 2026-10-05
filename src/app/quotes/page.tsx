"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCents } from "@/lib/money";
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_VALUES, type QuoteStatus } from "@/lib/quoteAccessorials";
import LoadingOverlay from "@/components/LoadingOverlay";

interface QuoteRow {
  id: string;
  quoteNumber: number;
  customerName: string | null;
  status: string;
  effectiveDate: string | null;
  expirationDate: string | null;
  quotedAmountCents: number | null;
}

function fmtDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "2-digit" }).format(d);
}

const PAGE_SIZE_OPTIONS = [50, 100, 150, 200];

export default function QuotesPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<QuoteStatus | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [rows, setRows] = useState<QuoteRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(async () => {
      if (cancelled) return;
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
        if (q) params.set("q", q);
        if (status) params.set("status", status);
        const res = await fetch(`/api/quotes?${params.toString()}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setRows(data.items);
          setTotal(data.total);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [q, status, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Quotes</h1>
        <Link
          href="/quotes/new"
          className="rounded bg-brand px-3 py-1.5 text-sm text-white hover:bg-brand-dark dark:bg-zinc-100 dark:text-zinc-900"
        >
          + New Quote
        </Link>
      </div>

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          className="w-full max-w-sm rounded border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-brand"
          placeholder="Search by quote #, contact, or location..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              setStatus(null);
              setPage(1);
            }}
            className={`rounded-full border px-2.5 py-1 text-xs ${
              status === null
                ? "border-brand bg-brand text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-zinc-300 dark:border-zinc-700"
            }`}
          >
            All
          </button>
          {QUOTE_STATUS_VALUES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`rounded-full border px-2.5 py-1 text-xs ${
                status === s
                  ? "border-brand bg-brand text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-300 dark:border-zinc-700"
              }`}
            >
              {QUOTE_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="relative overflow-auto rounded border border-zinc-200 dark:border-zinc-800">
        <LoadingOverlay show={loading} />
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Quote #</th>
              <th className="px-3 py-2 text-left font-medium">Customer</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 text-left font-medium">Effective</th>
              <th className="px-3 py-2 text-left font-medium">Expiration</th>
              <th className="px-3 py-2 text-right font-medium">Quoted Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((quote) => (
              <tr key={quote.id} className="border-t border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                <td className="px-3 py-2">
                  <Link href={`/quotes/${quote.id}`} className="font-mono text-xs text-blue-600 hover:underline dark:text-blue-400">
                    {quote.quoteNumber}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <Link href={`/quotes/${quote.id}`} className="hover:underline">
                    {quote.customerName ?? <span className="text-zinc-400">&mdash;</span>}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
                    {QUOTE_STATUS_LABELS[quote.status] ?? quote.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-zinc-500">{fmtDate(quote.effectiveDate)}</td>
                <td className="px-3 py-2 text-zinc-500">{fmtDate(quote.expirationDate)}</td>
                <td className="px-3 py-2 text-right text-zinc-700 dark:text-zinc-300">
                  {quote.quotedAmountCents != null ? formatCents(quote.quotedAmountCents) : ""}
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-zinc-500">
                  No quotes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>{total} quote(s)</span>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <label className="flex items-center gap-1.5">
            Rows per page
            <select
              className="rounded border border-zinc-300 bg-transparent px-1.5 py-1 text-xs dark:border-zinc-700 dark:bg-brand"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border border-zinc-300 px-2.5 py-1 disabled:opacity-40 dark:border-zinc-700"
          >
            Previous
          </button>
          <span className="text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded border border-zinc-300 px-2.5 py-1 disabled:opacity-40 dark:border-zinc-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
