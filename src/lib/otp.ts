import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * OTP core for the customer portal's passwordless login/register (see
 * src/app/api/customer/*). Codes are always 6 digits, hashed with bcrypt before storage
 * (never stored plaintext), expire after 10 minutes, and allow at most 5 verify attempts
 * before the code is dead (forcing a fresh send) — a deliberately small window since this
 * gates account creation/login, not just an email confirmation link.
 */
const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
/** Minimum gap between two sends to the same contact+purpose, so a click-happy user (or
 * a script) can't cheaply spam the mailbox or rack up OTP rows. */
const RESEND_COOLDOWN_MS = 30 * 1000;

export type OtpPurpose = "REGISTER" | "LOGIN";

function generateCode(): string {
  const max = 10 ** OTP_LENGTH;
  const n = Math.floor(Math.random() * max);
  return String(n).padStart(OTP_LENGTH, "0");
}

export class OtpCooldownError extends Error {
  constructor(public readonly retryAfterMs: number) {
    super("An OTP was already sent recently — please wait before requesting another.");
  }
}

/**
 * Creates and returns a fresh plaintext OTP code for (contact, purpose) — the caller is
 * responsible for actually delivering it (email today; see the request-otp routes).
 * Refuses to issue a new code within RESEND_COOLDOWN_MS of the last one for the same
 * contact+purpose (throws OtpCooldownError) rather than silently no-op'ing, so the UI can
 * show a clear "wait N seconds" message instead of a mysterious missing email.
 */
export async function createOtpChallenge(contact: string, purpose: OtpPurpose): Promise<string> {
  const recent = await prisma.otpChallenge.findFirst({
    where: { contact, purpose },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    const elapsedMs = Date.now() - recent.createdAt.getTime();
    if (elapsedMs < RESEND_COOLDOWN_MS) {
      throw new OtpCooldownError(RESEND_COOLDOWN_MS - elapsedMs);
    }
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  await prisma.otpChallenge.create({
    data: {
      contact,
      purpose,
      codeHash,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });
  return code;
}

/**
 * Verifies a submitted code against the latest still-valid (unconsumed, unexpired,
 * under the attempt limit) challenge for (contact, purpose). On success, marks it
 * consumed so it can't be replayed. On a wrong code, increments attempts (still
 * returning false) so MAX_ATTEMPTS is enforced across retries against the same code.
 */
export async function verifyOtpChallenge(contact: string, purpose: OtpPurpose, code: string): Promise<boolean> {
  const challenge = await prisma.otpChallenge.findFirst({
    where: {
      contact,
      purpose,
      // Mongo/Prisma: a plain `consumedAt: null` only matches a document where the field
      // is explicitly set to null, not one where it's simply absent (the state of every
      // freshly-created, never-consumed challenge) — see the same isSet:false note in
      // qbo.ts/zohoShipmentSync.ts. Must cover both to find an unconsumed challenge.
      OR: [{ consumedAt: null }, { consumedAt: { isSet: false } }],
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!challenge || challenge.attempts >= MAX_ATTEMPTS) return false;

  const matches = await bcrypt.compare(code, challenge.codeHash);
  if (!matches) {
    await prisma.otpChallenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } });
    return false;
  }

  await prisma.otpChallenge.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } });
  return true;
}

/** Normalizes an email for storage/lookup — lowercase, trimmed. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Normalizes a phone number for storage/lookup — digits only (drops spaces/dashes/parens/+). */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}
