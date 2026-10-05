import { syncAllPendingInvoices } from "@/lib/qbo";

/**
 * Why this exists: getValidAccessToken already auto-refreshes the QBO access token
 * on demand, but "on demand" meant "next time an invoice happens to sync" — so a
 * quiet period (or a transient QBO API error, or the connection being mid-refresh)
 * left POSTED invoices sitting unsynced until someone noticed and clicked "Sync Now"
 * on /quickbooks. Polling here keeps both the token and the invoice backlog current
 * without a person in the loop.
 *
 * This does NOT eliminate the need to occasionally re-authorize at
 * /api/quickbooks/connect — if the refresh token itself is expired or revoked
 * (Intuit's OAuth2 requires an interactive user consent; there's no way to mint a
 * new refresh token headlessly), every run just logs the same "reconnect" error
 * until someone does that.
 */
const BACKGROUND_SYNC_INTERVAL_MS = 5 * 60 * 1000;
/** First run shortly after server start, not immediately — avoids competing with
 * whatever else is happening during process boot. */
const INITIAL_RUN_DELAY_MS = 15 * 1000;

declare global {
  var __qboBackgroundSyncStarted: boolean | undefined;
}

async function runOnce(): Promise<void> {
  let results;
  try {
    results = await syncAllPendingInvoices();
  } catch (err) {
    console.error("[qbo] background sync run failed:", err);
    return;
  }
  if (results.length === 0) return;

  const failed = results.filter((r) => !r.success);
  const succeeded = results.length - failed.length;
  console.info(`[qbo] background sync: ${succeeded}/${results.length} invoice(s) synced`);

  if (failed.length === 0) return;

  // Collapse repeated identical errors (e.g. "not connected") into one line instead
  // of one per invoice — a single stale-connection error otherwise repeats once per
  // pending invoice, every interval, which drowns out anything else in the logs.
  const byMessage = new Map<string, string[]>();
  for (const r of failed) {
    const message = r.error ?? "unknown error";
    const ids = byMessage.get(message) ?? [];
    ids.push(r.invoiceId);
    byMessage.set(message, ids);
  }
  for (const [message, invoiceIds] of byMessage) {
    console.error(`[qbo] background sync failed for ${invoiceIds.length} invoice(s): ${message}`);
  }
}

/** Idempotent — safe to call more than once (e.g. dev HMR reloads); only the first call starts the interval. */
export function registerQboBackgroundSync(): void {
  if (globalThis.__qboBackgroundSyncStarted) return;
  globalThis.__qboBackgroundSyncStarted = true;

  const timeout = setTimeout(() => {
    void runOnce();
    // unref: this interval must never keep the process alive on its own during a
    // graceful shutdown — it's a courtesy background task, not a reason to hang.
    setInterval(() => void runOnce(), BACKGROUND_SYNC_INTERVAL_MS).unref();
  }, INITIAL_RUN_DELAY_MS);
  timeout.unref();
}
