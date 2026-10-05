import { cookies } from "next/headers";
import { getIronSession, type IronSession } from "iron-session";

export interface SessionData {
  userId?: string;
  email?: string;
  displayName?: string;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET ?? "dev-only-insecure-secret-change-me-32bytes!!",
  cookieName: "dwtms_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function requireSession(): Promise<IronSession<SessionData>> {
  const session = await getSession();
  if (!session.userId) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}
