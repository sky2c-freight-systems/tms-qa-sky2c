"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCents } from "@/lib/money";
import { INVOICE_STATUS_LABELS } from "@/lib/enumLabels";
import LoadingOverlay from "@/components/LoadingOverlay";

const STATUS_VALUES = ["NOT_APPLICABLE", "IN_PROGRESS", "POSTED", "CANCELLED", "DELETED"] as const;
type InvoiceStatusValue = (typeof STATUS_VALUES)[number];

interface InvoiceRow {
  id: string;
  fileNumber: string;
  invoiceNo: string | null;
  customerName: string | null;
  chargeCode: string | null;
  totalChargeCents: number;
  status: string;
  invoiceDate: string | null;
  dueDate: string | null;
  qboInvoiceId: string | null;
  isAdjustment: boolean;
  reversalOfId: string | null;
}

function fmtDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "2-digit" }).format(d);
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "POSTED"
      ? "bg-green-100 text-green-800"
      : status === "IN_PROGRESS"
        ? "bg-amber-100 text-amber-800"
        : status === "CANCELLED" || status === "DELETED"
          ? "bg-red-100 text-red-700"
          : "bg-slate-100 text-slate-600";
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${color}`}>
      {INVOICE_STATUS_LABELS[status] ?? status}
    </span>
  );
}

const PAGE_SIZE_OPTIONS = [50, 100, 150, 200];

export default function InvoicesPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<InvoiceStatusValue | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [rows, setRows] = useState<InvoiceRow[]>([]);
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
        const res = await fetch(`/api/invoices?${params.toString()}`);
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
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Invoices</h1>
        <p className="mt-1 text-sm text-muted">
          Every AR invoice across all shipments. Click a row to open its shipment&apos;s billing page.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          className="w-full max-w-sm rounded border border-border-light px-2.5 py-1.5 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
          placeholder="Search by file # or invoice #..."
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
              status === null ? "border-brand bg-brand text-white" : "border-border-light text-ink"
            }`}
          >
            All
          </button>
          {STATUS_VALUES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`rounded-full border px-2.5 py-1 text-xs ${
                status === s ? "border-brand bg-brand text-white" : "border-border-light text-ink"
              }`}
            >
              {INVOICE_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="relative overflow-auto rounded-lg border border-border-light bg-white shadow-sm">
        <LoadingOverlay show={loading} />
        <table className="w-full text-sm">
          <thead className="bg-surface">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-ink">File #</th>
              <th className="px-3 py-2 text-left font-medium text-ink">Invoice #</th>
              <th className="px-3 py-2 text-left font-medium text-ink">Customer</th>
              <th className="px-3 py-2 text-left font-medium text-ink">Charge Code</th>
              <th className="px-3 py-2 text-left font-medium text-ink">Status</th>
              <th className="px-3 py-2 text-left font-medium text-ink">Invoice Date</th>
              <th className="px-3 py-2 text-left font-medium text-ink">Due Date</th>
              <th className="px-3 py-2 text-left font-medium text-ink">QBO</th>
              <th className="px-3 py-2 text-right font-medium text-ink">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((invoice) => (
              <tr key={invoice.id} className="border-t border-border-light hover:bg-surface">
                <td className="px-3 py-2">
                  <Link
                    href={`/shipments/${invoice.fileNumber}/billing`}
                    className="font-mono text-xs text-navy hover:underline"
                  >
                    {invoice.fileNumber}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <Link href={`/shipments/${invoice.fileNumber}/billing`} className="hover:underline">
                    {invoice.invoiceNo ?? <span className="text-muted">&mdash;</span>}
                    {invoice.isAdjustment && (
                      <span className="ml-1 rounded bg-blue-100 px-1 text-[10px] text-blue-700">ADJ</span>
                    )}
                    {invoice.reversalOfId && (
                      <span className="ml-1 rounded bg-purple-100 px-1 text-[10px] text-purple-700">REV</span>
                    )}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <Link href={`/shipments/${invoice.fileNumber}/billing`} className="hover:underline">
                    {invoice.customerName ?? <span className="text-muted">&mdash;</span>}
                  </Link>
                </td>
                <td className="px-3 py-2 text-muted">{invoice.chargeCode ?? ""}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={invoice.status} />
                </td>
                <td className="px-3 py-2 text-muted">{fmtDate(invoice.invoiceDate)}</td>
                <td className="px-3 py-2 text-muted">{fmtDate(invoice.dueDate)}</td>
                <td className="px-3 py-2">
                  {invoice.qboInvoiceId ? (
                    <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] text-green-800">Synced</span>
                  ) : (
                    <span className="text-muted">&mdash;</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right text-ink">{formatCents(invoice.totalChargeCents)}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-muted">
                  No invoices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-muted">
        <div className="flex items-center gap-2">
          <span>{total} invoice(s)</span>
          <span className="text-border-light">|</span>
          <label className="flex items-center gap-1.5">
            Rows per page
            <select
              className="rounded border border-border-light bg-transparent px-1.5 py-1 text-xs text-ink"
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border border-border-light px-2.5 py-1 disabled:opacity-40 text-ink"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded border border-border-light px-2.5 py-1 disabled:opacity-40 text-ink"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
