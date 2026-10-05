"use client";

import { useState } from "react";
import Spinner from "@/components/Spinner";

interface SyncResult {
  invoiceId: string;
  success: boolean;
  error?: string;
}

export function SyncPanel() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [results, setResults] = useState<SyncResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setIsSyncing(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch("/api/quickbooks/sync", { method: "POST" });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Sync failed");
        return;
      }

      setResults(data?.results ?? []);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  }

  const succeeded = results?.filter((r) => r.success).length ?? 0;
  const failed = results?.filter((r) => !r.success).length ?? 0;

  return (
    <div>
      <button
        type="button"
        onClick={handleSync}
        disabled={isSyncing}
        className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSyncing && <Spinner className="h-4 w-4 text-white" />}
        {isSyncing ? "Syncing..." : "Sync Now"}
      </button>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {results ? (
        <div className="mt-4 text-sm text-gray-700">
          <p>
            {results.length === 0
              ? "No pending invoices to sync."
              : `${succeeded} succeeded, ${failed} failed (${results.length} total).`}
          </p>
          {failed > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-red-600">
              {results
                .filter((r) => !r.success)
                .map((r) => (
                  <li key={r.invoiceId}>
                    Invoice {r.invoiceId}: {r.error}
                  </li>
                ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
