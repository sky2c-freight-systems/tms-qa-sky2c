import { NextResponse } from "next/server";
import { z } from "zod";
import { createOtpChallenge, normalizeEmail, normalizePhone, OtpCooldownError } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/otpMailer";
import { findCustomerAccountByContact } from "@/lib/customerAccount";

const bodySchema = z
  .object({
    email: z.string().trim().email().optional(),
    phone: z.string().trim().min(1).optional(),
  })
  .refine((d) => d.email || d.phone, { message: "Enter an email or phone number." });

/**
 * POST /api/customer/login/request-otp
 *
 * Looks up an existing CustomerAccount (not Client — that match only happens once, at
 * registration). Always delivers to the account's own stored email regardless of
 * whether the caller identified themselves by email or phone — every CustomerAccount is
 * guaranteed to have an email on file (registration requires it), so this never needs
 * the phone-only fallback register's request-otp does.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const email = parsed.data.email ? normalizeEmail(parsed.data.email) : undefined;
  const phone = parsed.data.phone ? normalizePhone(parsed.data.phone) : undefined;

  const account = await findCustomerAccountByContact(email, phone);
  // Same "not found" message whether unregistered or inactive — don't let this endpoint
  // reveal which contact strings are/aren't registered.
  if (!account || !account.isActive || !account.email) {
    return NextResponse.json({ error: "No account found. Please register first." }, { status: 404 });
  }

  const contact = (email ?? phone) as string;
  try {
    const code = await createOtpChallenge(contact, "LOGIN");
    await sendOtpEmail(account.email, code, "LOGIN");
  } catch (err) {
    if (err instanceof OtpCooldownError) {
      return NextResponse.json({ error: err.message, retryAfterMs: err.retryAfterMs }, { status: 429 });
    }
    console.error("[customer login] failed to send OTP:", err);
    return NextResponse.json({ error: "Failed to send verification code. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ sentTo: account.email });
}
