"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import ClientLookupField from "@/components/ClientLookupField";
import { formatCents } from "@/lib/money";
import { INVOICE_STATUS_LABELS } from "@/lib/enumLabels";
import AttachmentGallery, { type AttachmentGalleryItem } from "@/components/AttachmentGallery";

type InvoiceStatus = "NOT_APPLICABLE" | "IN_PROGRESS" | "POSTED" | "CANCELLED" | "DELETED";

export interface ArInvoiceRow {
  id: string;
  shipmentId: string | null;
  fileNumber: string;
  invoiceNo: string | null;
  customerId: string;
  chargeCode: string | null;
  currencyCode: string | null;
  exchangeRate: number | null;
  prepaidOrCollect: string | null;
  totalChargeCents: number;
  invoiceDescription: string | null;
  blPrintDescription: string | null;
  status: InvoiceStatus;
  invoiceDate: Date | string | null;
  dueDate: Date | string | null;
  terms: string | null;
  isAdjustment: boolean;
  adjustmentOfId: string | null;
  reversalOfId: string | null;
  qboInvoiceId: string | null;
  qboSyncToken: string | null;
  qboLastSyncedAt: Date | string | null;
  createdAt: Date | string;
}

interface LookupOption {
  value: string;
  label: string;
}

interface BillingClientProps {
  fileNumber: string;
  shipmentId: string;
  defaultAccountId: string | null;
  initialBillableStatus: string;
  initialInvoices: ArInvoiceRow[];
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  NOT_APPLICABLE: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",
  IN_PROGRESS: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  POSTED: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  CANCELLED: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  DELETED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_BADGE_CLASSES[status] ?? STATUS_BADGE_CLASSES.NOT_APPLICABLE;
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {INVOICE_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function toDateOrNull(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(value: Date | string | null | undefined): string {
  const d = toDateOrNull(value);
  return d ? d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
}

function toDateInputValue(value: Date | string | null | undefined): string {
  const d = toDateOrNull(value);
  return d ? d.toISOString().slice(0, 10) : "";
}

interface InvoiceFormValues {
  customerId: string | null;
  chargeCode: string;
  currencyCode: string;
  exchangeRate: string;
  prepaidOrCollect: string;
  totalCharge: string;
  invoiceDescription: string;
  blPrintDescription: string;
  invoiceDate: string;
  dueDate: string;
  terms: string;
}

function emptyInvoiceForm(defaultAccountId: string | null): InvoiceFormValues {
  return {
    customerId: defaultAccountId,
    chargeCode: "",
    currencyCode: "USD",
    exchangeRate: "",
    prepaidOrCollect: "PREPAID",
    totalCharge: "",
    invoiceDescription: "",
    blPrintDescription: "",
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    terms: "",
  };
}

function invoiceToFormValues(inv: ArInvoiceRow): InvoiceFormValues {
  return {
    customerId: inv.customerId,
    chargeCode: inv.chargeCode ?? "",
    currencyCode: inv.currencyCode ?? "USD",
    exchangeRate: inv.exchangeRate != null ? String(inv.exchangeRate) : "",
    prepaidOrCollect: inv.prepaidOrCollect ?? "PREPAID",
    totalCharge: (inv.totalChargeCents / 100).toFixed(2),
    invoiceDescription: inv.invoiceDescription ?? "",
    blPrintDescription: inv.blPrintDescription ?? "",
    invoiceDate: toDateInputValue(inv.invoiceDate),
    dueDate: toDateInputValue(inv.dueDate),
    terms: inv.terms ?? "",
  };
}

const inputClass =
  "w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm focus:border-zinc-500 focus:outline-none disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-brand dark:disabled:bg-zinc-800";
const labelClass = "text-xs font-medium text-zinc-600 dark:text-zinc-400";
const buttonClass =
  "rounded border border-zinc-300 px-2.5 py-1 text-xs hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800";
const primaryButtonClass =
  "rounded bg-brand px-3 py-1.5 text-sm text-white hover:bg-brand-dark disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900";

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      {/* max-h + flex-col + overflow-hidden on the shell, overflow-y-auto only on the body
          below — the header stays put and the (possibly long, now that invoices can show
          a Documents gallery) body scrolls within the viewport instead of overflowing it. */}
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl dark:bg-brand">
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 p-5 pb-4 dark:border-zinc-800">
          <h2 className="text-base font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
            ✕
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function InvoiceFormModal({
  title,
  values,
  chargeCodeOptions,
  saving,
  error,
  onChange,
  onClose,
  onSubmit,
}: {
  title: string;
  values: InvoiceFormValues;
  chargeCodeOptions: LookupOption[];
  saving: boolean;
  error: string | null;
  onChange: (values: InvoiceFormValues) => void;
  onClose: () => void;
  onSubmit: (status: "IN_PROGRESS" | "POSTED") => void;
}) {
  function handleSubmit(e: FormEvent<HTMLFormElement>, status: "IN_PROGRESS" | "POSTED") {
    e.preventDefault();
    onSubmit(status);
  }

  return (
    <ModalShell title={title} onClose={onClose}>
      <form onSubmit={(e) => handleSubmit(e, "IN_PROGRESS")} className="space-y-4">
        <ClientLookupField
          label="Customer (Account)"
          role="ACCOUNT"
          value={values.customerId}
          onChange={(clientId) => onChange({ ...values, customerId: clientId })}
          required
          disabled={saving}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Charge Code</label>
            <select
              className={inputClass}
              value={values.chargeCode}
              disabled={saving}
              onChange={(e) => onChange({ ...values, chargeCode: e.target.value })}
            >
              <option value="">— Select —</option>
              {chargeCodeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Total Charge *</label>
            <input
              className={inputClass}
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={values.totalCharge}
              disabled={saving}
              onChange={(e) => onChange({ ...values, totalCharge: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Currency Code</label>
            <input
              className={inputClass}
              value={values.currencyCode}
              disabled={saving}
              onChange={(e) => onChange({ ...values, currencyCode: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Exchange Rate</label>
            <input
              className={inputClass}
              type="text"
              inputMode="decimal"
              value={values.exchangeRate}
              disabled={saving}
              onChange={(e) => onChange({ ...values, exchangeRate: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Prepaid / Collect</label>
            <select
              className={inputClass}
              value={values.prepaidOrCollect}
              disabled={saving}
              onChange={(e) => onChange({ ...values, prepaidOrCollect: e.target.value })}
            >
              <option value="PREPAID">Prepaid</option>
              <option value="COLLECT">Collect</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>Invoice Description</label>
          <textarea
            className={inputClass}
            rows={2}
            value={values.invoiceDescription}
            disabled={saving}
            onChange={(e) => onChange({ ...values, invoiceDescription: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>BL Print Description</label>
          <textarea
            className={inputClass}
            rows={2}
            value={values.blPrintDescription}
            disabled={saving}
            onChange={(e) => onChange({ ...values, blPrintDescription: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Invoice Date</label>
            <input
              className={inputClass}
              type="date"
              value={values.invoiceDate}
              disabled={saving}
              onChange={(e) => onChange({ ...values, invoiceDate: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Due Date</label>
            <input
              className={inputClass}
              type="date"
              value={values.dueDate}
              disabled={saving}
              onChange={(e) => onChange({ ...values, dueDate: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Terms</label>
            <input
              className={inputClass}
              value={values.terms}
              disabled={saving}
              onChange={(e) => onChange({ ...values, terms: e.target.value })}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <button type="button" onClick={onClose} disabled={saving} className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700">
            Cancel
          </button>
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving ? "Saving..." : "Save as Draft"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => onSubmit("POSTED")}
            className={primaryButtonClass}
          >
            {saving ? "Saving..." : "Save & Post"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

interface AdjustFormValues {
  totalCharge: string;
  invoiceDescription: string;
}

function AdjustModal({
  original,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  original: ArInvoiceRow;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: AdjustFormValues, status: "IN_PROGRESS" | "POSTED") => void;
}) {
  const [values, setValues] = useState<AdjustFormValues>({
    totalCharge: (original.totalChargeCents / 100).toFixed(2),
    invoiceDescription: "",
  });

  return (
    <ModalShell title={`Adjust Invoice ${original.invoiceNo ?? original.id}`} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(values, "IN_PROGRESS"); }} className="space-y-4">
        <p className="text-sm text-zinc-500">
          Original amount: {formatCents(original.totalChargeCents, original.currencyCode ?? "USD")}
        </p>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>New Charge Amount *</label>
          <input
            className={inputClass}
            type="text"
            inputMode="decimal"
            value={values.totalCharge}
            disabled={saving}
            onChange={(e) => setValues({ ...values, totalCharge: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Adjustment Description</label>
          <textarea
            className={inputClass}
            rows={2}
            value={values.invoiceDescription}
            disabled={saving}
            onChange={(e) => setValues({ ...values, invoiceDescription: e.target.value })}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <button type="button" onClick={onClose} disabled={saving} className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700">
            Cancel
          </button>
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving ? "Saving..." : "Save as Draft"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => onSubmit(values, "POSTED")}
            className={primaryButtonClass}
          >
            {saving ? "Saving..." : "Save & Post"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={labelClass}>{label}</span>
      <span className="text-sm">{value ?? <span className="text-zinc-400">—</span>}</span>
    </div>
  );
}

/** Read-only full-detail view of a single invoice — every field on ArInvoice, not just the summary columns shown in the table. */
function InvoiceDetailModal({ invoice, onClose }: { invoice: ArInvoiceRow; onClose: () => void }) {
  const [attachments, setAttachments] = useState<Array<{ id: string; name: string; size?: number }>>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setAttachmentsLoading(true);
      try {
        const res = await fetch(`/api/shipments/${invoice.fileNumber}/attachments?visibleOnly=1`);
        if (res.ok && !cancelled) {
          const body = await res.json();
          setAttachments(body.data ?? []);
        }
      } catch {
        // best-effort — the invoice detail itself already loaded fine either way
      } finally {
        if (!cancelled) setAttachmentsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [invoice.fileNumber]);

  const attachmentItems: AttachmentGalleryItem[] = attachments.map((a) => {
    const base = `/api/shipments/${invoice.fileNumber}/attachments/${a.id}`;
    return { id: a.id, name: a.name, size: a.size, viewHref: `${base}?view=1`, downloadHref: base };
  });

  return (
    <ModalShell title={`Invoice ${invoice.invoiceNo ?? invoice.id}`} onClose={onClose}>
      <div className="grid grid-cols-2 gap-4">
        <DetailRow label="Invoice No" value={invoice.invoiceNo} />
        <DetailRow label="Status" value={<StatusBadge status={invoice.status} />} />
        <DetailRow label="Charge Code" value={invoice.chargeCode} />
        <DetailRow
          label="Total Charge"
          value={formatCents(invoice.totalChargeCents, invoice.currencyCode ?? "USD")}
        />
        <DetailRow label="Currency" value={invoice.currencyCode} />
        <DetailRow label="Exchange Rate" value={invoice.exchangeRate ?? null} />
        <DetailRow label="Prepaid / Collect" value={invoice.prepaidOrCollect} />
        <DetailRow label="Terms" value={invoice.terms} />
        <DetailRow label="Invoice Date" value={formatDate(invoice.invoiceDate)} />
        <DetailRow label="Due Date" value={formatDate(invoice.dueDate)} />
        <DetailRow label="Created" value={formatDate(invoice.createdAt)} />
        <DetailRow label="Flags" value={renderInvoiceFlags(invoice)} />
        <div className="col-span-2">
          <DetailRow label="Invoice Description" value={invoice.invoiceDescription} />
        </div>
        <div className="col-span-2">
          <DetailRow label="BL Print Description" value={invoice.blPrintDescription} />
        </div>
        <DetailRow
          label="QuickBooks"
          value={
            invoice.qboInvoiceId ? (
              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                Synced — QBO Invoice #{invoice.qboInvoiceId}
              </span>
            ) : (
              "Not synced"
            )
          }
        />
        <DetailRow label="Last Synced" value={invoice.qboLastSyncedAt ? formatDate(invoice.qboLastSyncedAt) : null} />
      </div>

      <div className="mt-5 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Documents</h3>
        {attachmentsLoading ? (
          <p className="text-xs text-zinc-500">Loading...</p>
        ) : attachmentItems.length === 0 ? (
          <p className="text-xs text-zinc-500">No documents for this shipment yet.</p>
        ) : (
          <AttachmentGallery items={attachmentItems} />
        )}
      </div>

      <div className="mt-5 flex justify-end border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <button type="button" onClick={onClose} className={buttonClass}>
          Close
        </button>
      </div>
    </ModalShell>
  );
}

function renderInvoiceFlags(invoice: ArInvoiceRow): string {
  const flags: string[] = [];
  if (invoice.isAdjustment) flags.push("Adjustment");
  if (invoice.reversalOfId) flags.push("Reversal");
  return flags.length > 0 ? flags.join(", ") : "";
}

export default function BillingClient({
  fileNumber,
  defaultAccountId,
  initialBillableStatus,
  initialInvoices,
}: BillingClientProps) {
  const [invoices, setInvoices] = useState<ArInvoiceRow[]>(initialInvoices);
  const [billableStatus, setBillableStatus] = useState<string>(initialBillableStatus);
  const [chargeCodeOptions, setChargeCodeOptions] = useState<LookupOption[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  // Non-fatal: the invoice action itself succeeded, but the automatic QuickBooks
  // sync that runs on every POSTED transition failed (e.g. not connected yet).
  // Distinct from listError so a QBO hiccup doesn't read as "the post/reverse/
  // adjust failed" when it didn't.
  const [listNotice, setListNotice] = useState<string | null>(null);

  const [formModal, setFormModal] = useState<
    | null
    | { mode: "create"; values: InvoiceFormValues }
    | { mode: "edit"; invoice: ArInvoiceRow; values: InvoiceFormValues }
  >(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [viewTarget, setViewTarget] = useState<ArInvoiceRow | null>(null);

  const [adjustTarget, setAdjustTarget] = useState<ArInvoiceRow | null>(null);
  const [adjustSaving, setAdjustSaving] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/lookups?category=CHARGE_CODE")
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: Array<{ value: string; label: string }>) =>
        setChargeCodeOptions(rows.map((r) => ({ value: r.value, label: r.label })))
      )
      .catch(() => {});
  }, []);

  async function refresh() {
    try {
      const [invoicesRes, shipmentRes] = await Promise.all([
        fetch(`/api/shipments/${fileNumber}/invoices`),
        fetch(`/api/shipments/${fileNumber}`),
      ]);
      if (invoicesRes.ok) {
        const body = await invoicesRes.json();
        setInvoices(body.items ?? []);
      }
      if (shipmentRes.ok) {
        const body = await shipmentRes.json();
        if (body.data?.billableStatus) setBillableStatus(body.data.billableStatus);
      }
    } catch {
      setListError("Failed to refresh invoice list");
    }
  }

  const historyInvoices = useMemo(
    () => invoices.filter((inv) => inv.status === "CANCELLED" || inv.status === "DELETED"),
    [invoices]
  );
  const activeInvoices = useMemo(
    () => invoices.filter((inv) => inv.status !== "CANCELLED" && inv.status !== "DELETED"),
    [invoices]
  );

  function openCreateModal() {
    setFormError(null);
    setFormModal({ mode: "create", values: emptyInvoiceForm(defaultAccountId) });
  }

  function openEditModal(invoice: ArInvoiceRow) {
    setFormError(null);
    setFormModal({ mode: "edit", invoice, values: invoiceToFormValues(invoice) });
  }

  function invoiceFormBody(values: InvoiceFormValues, status: "IN_PROGRESS" | "POSTED") {
    return {
      customerId: values.customerId,
      chargeCode: values.chargeCode || null,
      currencyCode: values.currencyCode || null,
      exchangeRate: values.exchangeRate ? Number(values.exchangeRate) : null,
      prepaidOrCollect: values.prepaidOrCollect || null,
      totalCharge: values.totalCharge,
      invoiceDescription: values.invoiceDescription || null,
      blPrintDescription: values.blPrintDescription || null,
      invoiceDate: values.invoiceDate || null,
      dueDate: values.dueDate || null,
      terms: values.terms || null,
      status,
    };
  }

  async function handleFormSubmit(status: "IN_PROGRESS" | "POSTED") {
    if (!formModal) return;
    if (!formModal.values.customerId) {
      setFormError("Customer is required");
      return;
    }
    if (!formModal.values.totalCharge) {
      setFormError("Total charge is required");
      return;
    }

    setFormSaving(true);
    setFormError(null);
    setListNotice(null);
    try {
      if (formModal.mode === "create") {
        const res = await fetch(`/api/shipments/${fileNumber}/invoices`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(invoiceFormBody(formModal.values, status)),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? "Failed to create invoice");
        if (body.qboSyncError) {
          setListNotice(`Invoice saved, but QuickBooks sync failed: ${body.qboSyncError}`);
        }
      } else {
        const { id } = formModal.invoice;
        const patchRes = await fetch(`/api/invoices/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(invoiceFormBody(formModal.values, status)),
        });
        const patchBody = await patchRes.json().catch(() => ({}));
        if (!patchRes.ok) throw new Error(patchBody.error ?? "Failed to save invoice");

        if (status === "POSTED") {
          const postRes = await fetch(`/api/invoices/${id}/post`, { method: "POST" });
          const postBody = await postRes.json().catch(() => ({}));
          if (!postRes.ok) throw new Error(postBody.error ?? "Failed to post invoice");
          if (postBody.qboSyncError) {
            setListNotice(`Invoice posted, but QuickBooks sync failed: ${postBody.qboSyncError}`);
          }
        }
      }
      setFormModal(null);
      await refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save invoice");
    } finally {
      setFormSaving(false);
    }
  }

  async function handlePost(invoice: ArInvoiceRow) {
    setBusyId(invoice.id);
    setListError(null);
    setListNotice(null);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/post`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to post invoice");
      if (body.qboSyncError) {
        setListNotice(`Invoice posted, but QuickBooks sync failed: ${body.qboSyncError}`);
      }
      await refresh();
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to post invoice");
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(invoice: ArInvoiceRow) {
    if (!window.confirm(`Cancel invoice ${invoice.invoiceNo ?? invoice.id}?`)) return;
    setBusyId(invoice.id);
    setListError(null);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/cancel`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to cancel invoice");
      await refresh();
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to cancel invoice");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(invoice: ArInvoiceRow) {
    if (!window.confirm(`Delete invoice ${invoice.invoiceNo ?? invoice.id}? This also voids it in QuickBooks if synced.`)) return;
    setBusyId(invoice.id);
    setListError(null);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to delete invoice");
      await refresh();
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to delete invoice");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReverse(invoice: ArInvoiceRow) {
    if (!window.confirm(`Reverse invoice ${invoice.invoiceNo ?? invoice.id}? This creates a new posted reversal entry.`)) return;
    setBusyId(invoice.id);
    setListError(null);
    setListNotice(null);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/reverse`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to reverse invoice");
      if (body.qboSyncError) {
        setListNotice(`Invoice reversed, but QuickBooks sync failed: ${body.qboSyncError}`);
      }
      await refresh();
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to reverse invoice");
    } finally {
      setBusyId(null);
    }
  }

  async function handleAdjustSubmit(values: AdjustFormValues, status: "IN_PROGRESS" | "POSTED") {
    if (!adjustTarget) return;
    if (!values.totalCharge) {
      setAdjustError("New charge amount is required");
      return;
    }
    setAdjustSaving(true);
    setAdjustError(null);
    setListNotice(null);
    try {
      const res = await fetch(`/api/invoices/${adjustTarget.id}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalCharge: values.totalCharge,
          invoiceDescription: values.invoiceDescription || null,
          status,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to adjust invoice");
      if (body.qboSyncError) {
        setListNotice(`Adjustment saved, but QuickBooks sync failed: ${body.qboSyncError}`);
      }
      setAdjustTarget(null);
      await refresh();
    } catch (err) {
      setAdjustError(err instanceof Error ? err.message : "Failed to adjust invoice");
    } finally {
      setAdjustSaving(false);
    }
  }

  function renderRowActions(invoice: ArInvoiceRow) {
    const disabled = busyId === invoice.id;
    const viewButton = (
      <button type="button" className={buttonClass} disabled={disabled} onClick={() => setViewTarget(invoice)}>
        View
      </button>
    );
    if (invoice.status === "IN_PROGRESS") {
      return (
        <div className="flex flex-wrap gap-1.5">
          {viewButton}
          <button type="button" className={buttonClass} disabled={disabled} onClick={() => openEditModal(invoice)}>
            Edit
          </button>
          <button type="button" className={buttonClass} disabled={disabled} onClick={() => handlePost(invoice)}>
            Save & Post
          </button>
          <button type="button" className={buttonClass} disabled={disabled} onClick={() => handleCancel(invoice)}>
            Cancel
          </button>
          <button type="button" className={buttonClass} disabled={disabled} onClick={() => handleDelete(invoice)}>
            Delete
          </button>
        </div>
      );
    }
    if (invoice.status === "POSTED") {
      return (
        <div className="flex flex-wrap gap-1.5">
          {viewButton}
          <button type="button" className={buttonClass} disabled={disabled} onClick={() => handleReverse(invoice)}>
            Reverse
          </button>
          <button
            type="button"
            className={buttonClass}
            disabled={disabled}
            onClick={() => {
              setAdjustError(null);
              setAdjustTarget(invoice);
            }}
          >
            Adjust
          </button>
          <button type="button" className={buttonClass} disabled={disabled} onClick={() => handleDelete(invoice)}>
            Delete
          </button>
        </div>
      );
    }
    return <div className="flex flex-wrap gap-1.5">{viewButton}</div>;
  }

  function renderFlags(invoice: ArInvoiceRow) {
    const flags: string[] = [];
    if (invoice.isAdjustment) flags.push("Adjustment");
    if (invoice.reversalOfId) flags.push("Reversal");
    if (flags.length === 0) return <span className="text-zinc-400">—</span>;
    return (
      <span className="text-xs text-zinc-600 dark:text-zinc-400">{flags.join(", ")}</span>
    );
  }

  function renderTableRows(rows: ArInvoiceRow[], grayed: boolean) {
    return rows.map((inv) => (
      <tr key={inv.id} className={`border-t border-zinc-100 dark:border-zinc-800 ${grayed ? "opacity-60" : ""}`}>
        <td className="px-3 py-2 font-mono text-xs">{inv.invoiceNo ?? "—"}</td>
        <td className="px-3 py-2">{inv.chargeCode ?? "—"}</td>
        <td className="px-3 py-2 text-right">{formatCents(inv.totalChargeCents, inv.currencyCode ?? "USD")}</td>
        <td className="px-3 py-2">
          <StatusBadge status={inv.status} />
        </td>
        <td className="px-3 py-2">{formatDate(inv.invoiceDate)}</td>
        <td className="px-3 py-2">{formatDate(inv.dueDate)}</td>
        <td className="px-3 py-2">{renderFlags(inv)}</td>
        <td className="px-3 py-2">
          {inv.qboInvoiceId ? (
            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              Synced to QBO
            </span>
          ) : (
            <span className="text-xs text-zinc-400">—</span>
          )}
        </td>
        <td className="px-3 py-2">{renderRowActions(inv)}</td>
      </tr>
    ));
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Billing — File #{fileNumber}</h1>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-zinc-500">Billable Status:</span>
            <StatusBadge status={billableStatus} />
          </div>
        </div>
        <button type="button" className={primaryButtonClass} onClick={openCreateModal}>
          + New Invoice
        </button>
      </div>

      {listError && <p className="mb-3 text-sm text-red-600">{listError}</p>}
      {listNotice && (
        <p className="mb-3 rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">{listNotice}</p>
      )}

      <div className="overflow-x-auto rounded border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-brand">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Invoice No</th>
              <th className="px-3 py-2 text-left font-medium">Charge Code</th>
              <th className="px-3 py-2 text-right font-medium">Total Charge</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 text-left font-medium">Invoice Date</th>
              <th className="px-3 py-2 text-left font-medium">Due Date</th>
              <th className="px-3 py-2 text-left font-medium">Flags</th>
              <th className="px-3 py-2 text-left font-medium">QBO</th>
              <th className="px-3 py-2 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {renderTableRows(activeInvoices, false)}
            {activeInvoices.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-zinc-500">
                  No invoices yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {historyInvoices.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400">History (Cancelled / Deleted)</h2>
          <div className="overflow-x-auto rounded border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-brand">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Invoice No</th>
                  <th className="px-3 py-2 text-left font-medium">Charge Code</th>
                  <th className="px-3 py-2 text-right font-medium">Total Charge</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-left font-medium">Invoice Date</th>
                  <th className="px-3 py-2 text-left font-medium">Due Date</th>
                  <th className="px-3 py-2 text-left font-medium">Flags</th>
                  <th className="px-3 py-2 text-left font-medium">QBO</th>
                  <th className="px-3 py-2 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>{renderTableRows(historyInvoices, true)}</tbody>
            </table>
          </div>
        </div>
      )}

      {viewTarget && <InvoiceDetailModal invoice={viewTarget} onClose={() => setViewTarget(null)} />}

      {formModal && (
        <InvoiceFormModal
          title={formModal.mode === "create" ? "New Invoice" : `Edit Invoice ${formModal.invoice.invoiceNo ?? formModal.invoice.id}`}
          values={formModal.values}
          chargeCodeOptions={chargeCodeOptions}
          saving={formSaving}
          error={formError}
          onChange={(values) => setFormModal({ ...formModal, values } as typeof formModal)}
          onClose={() => setFormModal(null)}
          onSubmit={handleFormSubmit}
        />
      )}

      {adjustTarget && (
        <AdjustModal
          original={adjustTarget}
          saving={adjustSaving}
          error={adjustError}
          onClose={() => setAdjustTarget(null)}
          onSubmit={handleAdjustSubmit}
        />
      )}
    </div>
  );
}
