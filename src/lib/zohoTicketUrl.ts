/**
 * Builds the Zoho Desk agent-console deep link for a ticket.
 *
 * The URL shape mirrors the `webUrl` the Desk API returns on a ticket
 * (`https://desk.zoho.in/support/<portal>/ShowHomePage.do#Cases/dv/<ticketId>`), so the
 * link lands on the same ticket detail view an agent would reach from the console.
 *
 * Built server-side and handed to the client as a ready-made string rather than exposing
 * the domain/portal to the browser as NEXT_PUBLIC_* vars — the client has no other use
 * for them, and the ticket id alone isn't enough to construct this.
 *
 * Returns null when the portal isn't configured, so callers render the plain ticket
 * number instead of a link that would 404.
 */
export function buildZohoTicketUrl(ticketId: string | null | undefined): string | null {
  if (!ticketId) return null;
  const portal = process.env.ZOHO_DESK_PORTAL_NAME;
  if (!portal) return null;
  const domain = (process.env.ZOHO_DESK_API_DOMAIN ?? "https://desk.zoho.in").replace(/\/+$/, "");
  return `${domain}/support/${portal}/ShowHomePage.do#Cases/dv/${encodeURIComponent(ticketId)}`;
}
