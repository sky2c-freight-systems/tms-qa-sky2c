/**
 * Runs once per server process start (see Next.js's instrumentation.ts convention).
 * Used here to start a background retry for QBO invoice sync — see
 * registerQboBackgroundSync below for why this exists.
 */
export async function register() {
  // Prisma/node-quickbooks need real Node APIs (TCP sockets, etc.) — this file also
  // runs once for the Edge runtime compilation, which can't use them and doesn't
  // need to (this app has no Edge routes touching QBO).
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { registerQboBackgroundSync } = await import("@/lib/qboBackgroundSync");
  registerQboBackgroundSync();
}
