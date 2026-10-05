import { NextResponse } from "next/server";
import { handleOAuthCallback } from "@/lib/qbo";

// NOT behind the session middleware (see src/middleware.ts WEBHOOK_PREFIXES) —
// this is the OAuth redirect target Intuit calls directly, so it authenticates
// itself via the OAuth authorization code rather than the session cookie.
//
// Redirect target is built from APP_BASE_URL rather than request.url: behind the
// IIS reverse proxy, Next.js's own request.url reconstruction falls back to
// `http(s)://localhost:<port>` unless `experimental.trustHostHeader` is set (it
// isn't) — it does NOT reliably reflect the public Host header, regardless of
// IIS-side preserveHostHeader/X-Forwarded-Proto settings. APP_BASE_URL is set
// explicitly in .env for exactly this reason. Falls back to request.url for
// local dev where no reverse proxy sits in front of it.
export async function GET(request: Request) {
  const baseUrl = process.env.APP_BASE_URL ?? request.url;
  const redirectUrl = new URL("/quickbooks", baseUrl);

  try {
    const connection = await handleOAuthCallback(request.url);
    redirectUrl.searchParams.set("qbo", "connected");
    redirectUrl.searchParams.set("realmId", connection.realmId);
  } catch (err) {
    redirectUrl.searchParams.set("qbo", "error");
    redirectUrl.searchParams.set(
      "message",
      err instanceof Error ? err.message : "Unknown error"
    );
  }

  return NextResponse.redirect(redirectUrl, { status: 302 });
}
