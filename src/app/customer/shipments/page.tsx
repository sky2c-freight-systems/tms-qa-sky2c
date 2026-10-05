"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CustomerProfileMenu, { type CustomerProfile } from "@/components/CustomerProfileMenu";

interface CustomerShipmentRow {
  fileNumber: string;
  status: string;
  statusLabel: string;
  origin: string | null;
  destination: string | null;
  shipAt: string | null;
  etaAt: string | null;
  createdAt: string;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "2-digit" }).format(d);
}

export default function CustomerShipmentsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [rows, setRows] = useState<CustomerShipmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [meRes, shipmentsRes] = await Promise.all([
          fetch("/api/customer/me"),
          fetch("/api/customer/shipments"),
        ]);
        if (meRes.status === 401 || shipmentsRes.status === 401) {
          router.push("/customer/login");
          return;
        }
        if (meRes.ok) {
          const meBody = await meRes.json();
          if (!cancelled) {
            setProfile({
              clientName: meBody.data?.clientName ?? null,
              contactName: meBody.data?.contactName ?? null,
              email: meBody.data?.email ?? null,
              phone: meBody.data?.phone ?? null,
            });
          }
        }
        if (shipmentsRes.ok) {
          const body = await shipmentsRes.json();
          if (!cancelled) setRows(body.data ?? []);
        } else {
          throw new Error("Failed to load shipments");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load shipments");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Your Shipments</h1>
        {profile && <CustomerProfileMenu profile={profile} />}
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500">No shipments yet.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">File #</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Origin</th>
                <th className="px-3 py-2 text-left font-medium">Destination</th>
                <th className="px-3 py-2 text-left font-medium">Pickup</th>
                <th className="px-3 py-2 text-left font-medium">ETA</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.fileNumber} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <Link href={`/customer/shipments/${r.fileNumber}`} className="font-mono text-blue-600 hover:underline">
                      {r.fileNumber}
                    </Link>
                    <Link
                      href={`/tracking/${r.fileNumber}`}
                      target="_blank"
                      className="ml-2 text-xs text-slate-400 hover:text-blue-600 hover:underline"
                      title="Open the tracking page"
                    >
                      track
                    </Link>
                  </td>
                  <td className="px-3 py-2">{r.statusLabel}</td>
                  <td className="px-3 py-2 text-slate-500">{r.origin ?? "—"}</td>
                  <td className="px-3 py-2 text-slate-500">{r.destination ?? "—"}</td>
                  <td className="px-3 py-2 text-slate-500">{formatDate(r.shipAt)}</td>
                  <td className="px-3 py-2 text-slate-500">{formatDate(r.etaAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
