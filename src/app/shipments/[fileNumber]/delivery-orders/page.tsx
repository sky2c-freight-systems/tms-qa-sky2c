"use client";

import Link from "next/link";
import { useEffect, useState, type SubmitEvent } from "react";
import { useParams } from "next/navigation";
import Spinner from "@/components/Spinner";

interface DeliveryOrder {
  id: string;
  scheduledDate: string | null;
  scheduledWindow: string | null;
  driverName: string | null;
  truckNumber: string | null;
  contactPhone: string | null;
  notes: string | null;
  status: string;
}

interface DeliveryOrderFormValues {
  scheduledDate: string;
  scheduledWindow: string;
  driverName: string;
  truckNumber: string;
  contactPhone: string;
  notes: string;
  status: string;
}

const EMPTY_VALUES: DeliveryOrderFormValues = {
  scheduledDate: "",
  scheduledWindow: "",
  driverName: "",
  truckNumber: "",
  contactPhone: "",
  notes: "",
  status: "SCHEDULED",
};

function toDateInputValue(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toFormValues(order: DeliveryOrder): DeliveryOrderFormValues {
  return {
    scheduledDate: toDateInputValue(order.scheduledDate),
    scheduledWindow: order.scheduledWindow ?? "",
    driverName: order.driverName ?? "",
    truckNumber: order.truckNumber ?? "",
    contactPhone: order.contactPhone ?? "",
    notes: order.notes ?? "",
    status: order.status,
  };
}

function toBody(values: DeliveryOrderFormValues) {
  return {
    scheduledDate: values.scheduledDate ? new Date(values.scheduledDate).toISOString() : null,
    scheduledWindow: values.scheduledWindow || null,
    driverName: values.driverName || null,
    truckNumber: values.truckNumber || null,
    contactPhone: values.contactPhone || null,
    notes: values.notes || null,
    status: values.status || null,
  };
}

const inputClass =
  "rounded border border-zinc-300 px-2.5 py-1.5 text-sm focus:border-zinc-500 focus:outline-none disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-brand dark:disabled:bg-zinc-800";
const fieldLabelClass = "text-xs font-medium text-zinc-600 dark:text-zinc-400";

function DeliveryOrderFields({
  values,
  onChange,
  disabled,
}: {
  values: DeliveryOrderFormValues;
  onChange: (values: DeliveryOrderFormValues) => void;
  disabled?: boolean;
}) {
  function set<K extends keyof DeliveryOrderFormValues>(key: K, value: DeliveryOrderFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
      <label className="flex flex-col gap-1">
        <span className={fieldLabelClass}>Scheduled Date</span>
        <input
          type="date"
          className={inputClass}
          value={values.scheduledDate}
          disabled={disabled}
          onChange={(e) => set("scheduledDate", e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={fieldLabelClass}>Scheduled Window</span>
        <input
          className={inputClass}
          placeholder="e.g. 8am-12pm"
          value={values.scheduledWindow}
          disabled={disabled}
          onChange={(e) => set("scheduledWindow", e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={fieldLabelClass}>Status</span>
        <input
          className={inputClass}
          value={values.status}
          disabled={disabled}
          onChange={(e) => set("status", e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={fieldLabelClass}>Driver Name</span>
        <input
          className={inputClass}
          value={values.driverName}
          disabled={disabled}
          onChange={(e) => set("driverName", e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={fieldLabelClass}>Truck Number</span>
        <input
          className={inputClass}
          value={values.truckNumber}
          disabled={disabled}
          onChange={(e) => set("truckNumber", e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={fieldLabelClass}>Contact Phone</span>
        <input
          className={inputClass}
          value={values.contactPhone}
          disabled={disabled}
          onChange={(e) => set("contactPhone", e.target.value)}
        />
      </label>
      <label className="col-span-full flex flex-col gap-1">
        <span className={fieldLabelClass}>Notes</span>
        <textarea
          className={`${inputClass} min-h-16`}
          value={values.notes}
          disabled={disabled}
          onChange={(e) => set("notes", e.target.value)}
        />
      </label>
    </div>
  );
}

export default function DeliveryOrdersPage() {
  const params = useParams<{ fileNumber: string }>();
  const fileNumber = params.fileNumber;

  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newValues, setNewValues] = useState<DeliveryOrderFormValues>({ ...EMPTY_VALUES });
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<DeliveryOrderFormValues>({ ...EMPTY_VALUES });
  const [saving, setSaving] = useState(false);

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await fetch(`/api/shipments/${fileNumber}/delivery-orders`);
      if (!res.ok) throw new Error("Failed to load delivery orders");
      const data = await res.json();
      setOrders(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load delivery orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Fetching on mount/fileNumber change and populating local state from the response is
    // the state this effect synchronizes with the server.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileNumber]);

  async function handleCreate(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`/api/shipments/${fileNumber}/delivery-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toBody(newValues)),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to create delivery order");
      }
      setNewValues({ ...EMPTY_VALUES });
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create delivery order");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(order: DeliveryOrder) {
    setEditingId(order.id);
    setEditValues(toFormValues(order));
  }

  async function handleSaveEdit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/shipments/${fileNumber}/delivery-orders/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toBody(editValues)),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save delivery order");
      }
      setEditingId(null);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save delivery order");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Delivery Orders — {fileNumber}</h1>
        <Link href={`/shipments/${fileNumber}`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          &larr; Back to Shipment
        </Link>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="mb-6 space-y-3 rounded border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">Add Delivery Order</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <DeliveryOrderFields values={newValues} onChange={setNewValues} disabled={creating} />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="rounded bg-brand px-3 py-1.5 text-sm text-white hover:bg-brand-dark disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {creating ? "Adding..." : "Add Delivery Order"}
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-zinc-500">
          <Spinner className="h-4 w-4 text-brand" />
          Loading...
        </p>
      ) : (
        <div className="space-y-3">
          {orders.length === 0 && <p className="text-sm text-zinc-500">No delivery orders yet.</p>}
          {orders.map((order) =>
            editingId === order.id ? (
              <form
                key={order.id}
                onSubmit={handleSaveEdit}
                className="space-y-3 rounded border border-zinc-300 p-4 dark:border-zinc-700"
              >
                <DeliveryOrderFields values={editValues} onChange={setEditValues} disabled={saving} />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
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
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            ) : (
              <div
                key={order.id}
                className="flex items-center justify-between rounded border border-zinc-200 p-3 text-sm dark:border-zinc-800"
              >
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
                  <span>
                    <span className="text-zinc-500">Date: </span>
                    {order.scheduledDate ? toDateInputValue(order.scheduledDate) : "—"}
                  </span>
                  <span>
                    <span className="text-zinc-500">Window: </span>
                    {order.scheduledWindow ?? "—"}
                  </span>
                  <span>
                    <span className="text-zinc-500">Status: </span>
                    {order.status}
                  </span>
                  <span>
                    <span className="text-zinc-500">Driver: </span>
                    {order.driverName ?? "—"}
                  </span>
                  <span>
                    <span className="text-zinc-500">Truck: </span>
                    {order.truckNumber ?? "—"}
                  </span>
                  <span>
                    <span className="text-zinc-500">Phone: </span>
                    {order.contactPhone ?? "—"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(order)}
                  className="rounded border border-zinc-300 px-2 py-0.5 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-brand-dark"
                >
                  Edit
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
