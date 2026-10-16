import type { Client } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeEmail, normalizePhone } from "@/lib/otp";
import { escapeRegex } from "@/lib/mongoText";

/**
 * Compares two digit-only phone strings by their last 10 digits, not full equality —
 * numbers on file are inconsistently stored with/without a leading country code (e.g.
 * Client.telephone "+15107433300" vs a customer typing "510-743-3300"), and exact-string
 * matching after stripping punctuation still misses that case. Requires both to have at
 * least 10 digits so a short/garbage input can't accidentally match via a tiny suffix.
 */
function phoneNumbersMatch(a: string, b: string): boolean {
  if (a.length < 10 || b.length < 10) return false;
  return a.slice(-10) === b.slice(-10);
}

/**
 * Finds the active, isCustomer=true Client (Account) matching a normalized email and/or
 * phone — the auto-match step for customer-portal registration. Client.telephone is
 * free-text (e.g. "+1 (510) 743-3300"), so phone matching can't be done as a DB-level
 * string filter against the digits-only normalized input; the email side is narrowed at
 * the DB (case-insensitive equality), then phone is checked in-app against every
 * candidate that has telephone set at all. This assumes the customer-facing "Account"
 * client population is small enough to scan — true for this single-tenant app's current
 * scale, but would need a stored normalized-phone column if that ever stops holding.
 */
export async function findMatchingCustomerClient(
  email: string | undefined,
  phone: string | undefined
): Promise<Client | null> {
  if (!email && !phone) return null;

  if (email) {
    const byEmail = await prisma.client.findFirst({
      where: { isCustomer: true, isActive: true, emailAddress: { equals: escapeRegex(email), mode: "insensitive" } },
    });
    if (byEmail) return byEmail;
  }

  if (phone) {
    const candidates = await prisma.client.findMany({
      where: { isCustomer: true, isActive: true, telephone: { not: null } },
    });
    const byPhone = candidates.find((c) => c.telephone && phoneNumbersMatch(normalizePhone(c.telephone), phone));
    if (byPhone) return byPhone;
  }

  return null;
}

/** Email to actually deliver the OTP to: what the customer typed, or — if they only gave
 * a phone — the matched Client's own on-file email (its own trusted contact, not a third
 * party). Null means there's nowhere to send a code today (email-only delivery). */
export function resolveOtpDeliveryEmail(email: string | undefined, client: Client): string | null {
  if (email) return email;
  return client.emailAddress ? normalizeEmail(client.emailAddress) : null;
}

/**
 * Finds a CustomerAccount by email and/or phone. Email is an exact DB lookup (stored
 * already-normalized at registration), but phone still needs the same last-10-digit
 * fuzzy match as findMatchingCustomerClient — a customer could register typing their
 * number one way and log in typing it another (with/without country code) — a plain
 * equality lookup on CustomerAccount.phone would wrongly treat those as different people.
 */
export async function findCustomerAccountByContact(email: string | undefined, phone: string | undefined) {
  if (!email && !phone) return null;

  if (email) {
    const byEmail = await prisma.customerAccount.findFirst({ where: { email } });
    if (byEmail) return byEmail;
  }

  if (phone) {
    const candidates = await prisma.customerAccount.findMany({ where: { phone: { not: null } } });
    const byPhone = candidates.find((a) => a.phone && phoneNumbersMatch(a.phone, phone));
    if (byPhone) return byPhone;
  }

  return null;
}
