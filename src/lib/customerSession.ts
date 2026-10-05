import { cookies } from "next/headers";
import { getIronSession, type IronSession } from "iron-session";

/**
 * Session for the OTP-based customer portal — deliberately separate from the internal
 * staff session (see session.ts's "dwtms_session"): different cookie name, so a customer
 * login never overlaps with (or could be confused for) staff auth, and a customer can
 * never end up on an internal-only page just because some cookie happened to be set.
 */
export interface CustomerSessionData {
  customerAccountId?: string;
  clientId?: string;
  email?: string | null;
}

export const CUSTOMER_SESSION_COOKIE_NAME = "dwtms_customer_session";

const customerSessionOptions = {
  password: process.env.SESSION_SECRET ?? "dev-only-insecure-secret-change-me-32bytes!!",
  cookieName: CUSTOMER_SESSION_COOKIE_NAME,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

export async function getCustomerSession(): Promise<IronSession<CustomerSessionData>> {
  return getIronSession<CustomerSessionData>(await cookies(), customerSessionOptions);
}

export async function requireCustomerSession(): Promise<IronSession<CustomerSessionData>> {
  const session = await getCustomerSession();
  if (!session.customerAccountId) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}
