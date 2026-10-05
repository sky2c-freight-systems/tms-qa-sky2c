"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DOMESTIC_TYPE_LABELS, toOptions } from "@/lib/enumLabels";
import LoadingOverlay from "@/components/LoadingOverlay";

interface ShipmentSummary {
  fileNumber: string;
  origin: string | null;
  destination: string | null;
}

export default function NewShipmentPage() {
  const router = useRouter();
  const [domesticType, setDomesticType] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ShipmentSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!domesticType) return;
    let cancelled = false;
    const handle = setTimeout(async () => {
      if (cancelled) return;
      setLoading(true);
      try {
        const params = new URLSearchParams({ pageSize: "20" });
        if (q) params.set("q", q);
        const res = await fetch(`/api/shipments?${params.toString()}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setResults(data.items);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [q, domesticType]);

  function proceed(copyFrom: string) {
    if (!domesticType) return;
    const params = new URLSearchParams({ domesticType });
    if (copyFrom) params.set("copyFrom", copyFrom);
    router.push(`/shipments/new/form?${params.toString()}`);
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-xl font-semibold">New Shipment</h1>

      <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">1. Choose a shipment type</p>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {toOptions(DOMESTIC_TYPE_LABELS).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setDomesticType(opt.value)}
            className={`rounded border px-3 py-4 text-sm font-medium ${
              domesticType === opt.value
                ? "border-brand bg-brand text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {domesticType && (
        <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
            2. Optionally copy an existing shipment&apos;s parties/routing (file number, status, and dates always
            reset for the new shipment)
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            <input
              className="w-full max-w-sm rounded border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-brand"
              placeholder="Search by file number, origin, or destination..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button
              type="button"
              onClick={() => proceed("")}
              className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Start Blank
            </button>
          </div>
          <div className="relative max-h-72 overflow-auto rounded border border-zinc-200 dark:border-zinc-800">
            <LoadingOverlay show={loading} />
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">File #</th>
                  <th className="px-3 py-2 text-left font-medium">Origin</th>
                  <th className="px-3 py-2 text-left font-medium">Destination</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {results.map((s) => (
                  <tr key={s.fileNumber} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="px-3 py-2 font-mono text-xs">{s.fileNumber}</td>
                    <td className="px-3 py-2 text-zinc-500">{s.origin ?? "—"}</td>
                    <td className="px-3 py-2 text-zinc-500">{s.destination ?? "—"}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => proceed(s.fileNumber)}
                        className="rounded border border-zinc-300 px-2 py-0.5 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-brand-dark"
                      >
                        Copy
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && results.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-zinc-500">
                      No shipments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
