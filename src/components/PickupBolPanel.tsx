"use client";

import { useCallback, useEffect, useState } from "react";
import Spinner from "@/components/Spinner";

interface BolRow {
  id: string;
  fileName: string;
  source: "MANUAL" | "AUTO";
  createdAt: string;
}

function formatWhen(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ""
    : new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
}

/**
 * Pickup Bill of Lading for a Dispatch shipment: "Generate BOL" renders a new version from
 * the shipment's current fields; the "Auto-generate BOL" toggle is app-wide (every Dispatch
 * shipment), and while it's on a Zoho ticket create/update refreshes the BOL by itself.
 * Every version stays listed for download — see src/lib/pickupBol.ts.
 */
export default function PickupBolPanel({ fileNumber }: { fileNumber: string }) {
  const [rows, setRows] = useState<BolRow[]>([]);
  const [autoEnabled, setAutoEnabled] = useState<boolean | null>(null);
  const [generating, setGenerating] = useState(false);
  const [togglingAuto, setTogglingAuto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pdfUrl = (id: string, download = false) => `/api/shipments/${fileNumber}/bol/${id}${download ? "?download=1" : ""}`;

  const loadRows = useCallback(async () => {
    const res = await fetch(`/api/shipments/${fileNumber}/bol`);
    if (res.ok) setRows((await res.json()).data);
  }, [fileNumber]);

  useEffect(() => {
    // Initial load; setState happens after the awaits, not synchronously in the effect.
    void (async () => {
      await loadRows();
      const res = await fetch("/api/settings/auto-pickup-bol");
      if (res.ok) setAutoEnabled((await res.json()).data.enabled);
    })();
  }, [loadRows]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    // Opened synchronously so the browser doesn't block it as a popup; pointed at the PDF
    // once it exists.
    const tab = window.open("", "_blank");
    try {
      const res = await fetch(`/api/shipments/${fileNumber}/bol`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to generate BOL");
      if (tab) tab.location.href = pdfUrl(body.data.id);
      await loadRows();
    } catch (err) {
      tab?.close();
      setError(err instanceof Error ? err.message : "Failed to generate BOL");
    } finally {
      setGenerating(false);
    }
  }

  async function handleToggleAuto(next: boolean) {
    setTogglingAuto(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/auto-pickup-bol", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) throw new Error("Failed to update the auto-generate setting");
      setAutoEnabled(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update the auto-generate setting");
    } finally {
      setTogglingAuto(false);
    }
  }

  return (
    <div className="mb-4 rounded border border-zinc-200 p-3 text-sm dark:border-zinc-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Pickup Bill of Lading</h2>
        <div className="flex flex-wrap items-center gap-4">
          <label
            className="flex cursor-pointer items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400"
            title="Applies to every Dispatch shipment: while on, a Zoho ticket create/update regenerates the BOL when its fields changed"
          >
            <button
              type="button"
              role="switch"
              aria-checked={!!autoEnabled}
              disabled={autoEnabled === null || togglingAuto}
              onClick={() => handleToggleAuto(!autoEnabled)}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition disabled:opacity-50 ${
                autoEnabled ? "bg-green-600" : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition ${autoEnabled ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
            Auto-generate BOL <span className="text-zinc-400">(all Dispatch shipments)</span>
          </label>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-1.5 rounded bg-brand px-3 py-1.5 text-sm text-white hover:bg-brand-dark disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {generating && <Spinner className="h-3.5 w-3.5" />}
            {generating ? "Generating..." : "Generate BOL"}
          </button>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {rows.length > 0 ? (
        <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-2 py-1.5">
              <a href={pdfUrl(r.id)} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-blue-600 hover:underline dark:text-blue-400">
                {r.fileName}
              </a>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  r.source === "AUTO"
                    ? "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {r.source === "AUTO" ? "Auto" : "Manual"}
              </span>
              <span className="text-xs text-zinc-500">{formatWhen(r.createdAt)}</span>
              <a href={pdfUrl(r.id, true)} className="ml-auto text-xs text-zinc-500 hover:text-blue-600 hover:underline">
                Download
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-zinc-500">No BOL generated yet.</p>
      )}
    </div>
  );
}
