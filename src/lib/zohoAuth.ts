/**
 * Shared-secret auth for the inbound Zoho Desk webhooks (src/app/api/webhooks/zoho/*).
 * Zoho itself can't be given a "please retry" signal without risking retry storms, so an
 * auth failure here must NEVER produce a non-200 response — callers should log and
 * silently no-op, not surface a 401. This is intentionally different from the
 * requireSession()-based auth used by the read-only sync-status/shipments GET routes.
 *
 * Accepts the secret either as a custom header (`x-zoho-webhook-secret`) or as a
 * `?secret=` query param on the webhook URL — Zoho Desk's built-in Webhook action UI
 * doesn't always expose a way to add custom headers, but every version lets you type a
 * full URL, so baking the secret into the URL (e.g.
 * `.../ticket-created?secret=...`) is the one configuration path guaranteed to work.
 */
export function isZohoWebhookAuthorized(request: Request): boolean {
  const expected = process.env.ZOHO_WEBHOOK_SECRET;
  if (!expected) return false;
  const header = request.headers.get("x-zoho-webhook-secret");
  if (header && header === expected) return true;
  const url = new URL(request.url);
  const queryParam = url.searchParams.get("secret");
  return !!queryParam && queryParam === expected;
}
