"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ClientRole } from "@/lib/clientService";
import LoadingOverlay from "@/components/LoadingOverlay";

interface ClientRow {
  id: string;
  clientId: string;
  name: string;
  city: string | null;
  state: string | null;
  telephone: string | null;
  isActive: boolean;
  isShipper: boolean;
  isConsignee: boolean;
  isCarrier: boolean;
  isNotify: boolean;
  isSoldTo: boolean;
  isShipTo: boolean;
  isCustomer: boolean;
  isVendor: boolean;
}

const ROLE_CHIPS: { role: ClientRole; label: string }[] = [
  { role: "SHIPPER", label: "Shipper" },
  { role: "CONSIGNEE", label: "Consignee" },
  { role: "CARRIER", label: "Carrier" },
  { role: "NOTIFY", label: "Notify" },
  { role: "SOLD_TO", label: "Sold To" },
  { role: "SHIP_TO", label: "Ship To" },
  { role: "ACCOUNT", label: "Account" },
];

const ROLE_FIELD: Record<ClientRole, keyof ClientRow> = {
  SHIPPER: "isShipper",
  CONSIGNEE: "isConsignee",
  CARRIER: "isCarrier",
  NOTIFY: "isNotify",
  SOLD_TO: "isSoldTo",
  SHIP_TO: "isShipTo",
  ACCOUNT: "isCustomer",
};

const PAGE_SIZE_OPTIONS = [50, 100, 150, 200];

export default function ClientsPage() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState<ClientRole | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [rows, setRows] = useState<ClientRow[]>([]);
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
        if (role) params.set("role", role);
        const res = await fetch(`/api/clients?${params.toString()}`);
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
  }, [q, role, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clients</h1>
        <Link
          href="/clients/new"
          className="rounded bg-brand px-3 py-1.5 text-sm text-white hover:bg-brand-dark dark:bg-zinc-100 dark:text-zinc-900"
        >
          + New Client
        </Link>
      </div>

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          className="w-full max-w-sm rounded border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-brand"
          placeholder="Search by name or client ID..."
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
              setRole(null);
              setPage(1);
            }}
            className={`rounded-full border px-2.5 py-1 text-xs ${
              role === null
                ? "border-brand bg-brand text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-zinc-300 dark:border-zinc-700"
            }`}
          >
            All
          </button>
          {ROLE_CHIPS.map((r) => (
            <button
              key={r.role}
              type="button"
              onClick={() => {
                setRole(r.role);
                setPage(1);
              }}
              className={`rounded-full border px-2.5 py-1 text-xs ${
                role === r.role
                  ? "border-brand bg-brand text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-300 dark:border-zinc-700"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative overflow-auto rounded border border-zinc-200 dark:border-zinc-800">
        <LoadingOverlay show={loading} />
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Client ID</th>
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 text-left font-medium">City / State</th>
              <th className="px-3 py-2 text-left font-medium">Phone</th>
              <th className="px-3 py-2 text-left font-medium">Roles</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                <td className="px-3 py-2">
                  <Link href={`/clients/${c.id}`} className="font-mono text-xs text-blue-600 hover:underline dark:text-blue-400">
                    {c.clientId}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <Link href={`/clients/${c.id}`} className="hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-3 py-2 text-zinc-500">{[c.city, c.state].filter(Boolean).join(", ")}</td>
                <td className="px-3 py-2 text-zinc-500">{c.telephone}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {ROLE_CHIPS.filter((r) => c[ROLE_FIELD[r.role]]).map((r) => (
                      <span key={r.role} className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] dark:bg-zinc-800">
                        {r.label}
                      </span>
                    ))}
                    {c.isVendor && <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] dark:bg-zinc-800">Vendor</span>}
                  </div>
                </td>
                <td className="px-3 py-2">
                  {c.isActive ? (
                    <span className="text-green-700 dark:text-green-500">Active</span>
                  ) : (
                    <span className="text-zinc-400">Inactive</span>
                  )}
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-zinc-500">
                  No clients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>{total} client(s)</span>
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
