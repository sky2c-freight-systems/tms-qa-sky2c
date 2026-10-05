import { NextResponse } from "next/server";
import { z } from "zod";
import { createOtpChallenge, normalizeEmail, normalizePhone, OtpCooldownError } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/otpMailer";
import { findMatchingCustomerClient, findCustomerAccountByContact, resolveOtpDeliveryEmail } from "@/lib/customerAccount";

const bodySchema = z
  .object({
    email: z.string().trim().email().optional(),
    phone: z.string().trim().min(1).optional(),
  })
  .refine((d) => d.email || d.phone, { message: "Enter an email or phone number." });

/**
 * POST /api/customer/register/request-otp
 *
 * Auto-match only — never creates a new Client. The submitted email/phone must match an
 * existing, active Client with isCustomer=true (an "Account"), and must not already have
 * a CustomerAccount. OTP delivery is email-only for now (see otp.ts): if the caller gave
 * only a phone, the matched Client's own on-file email is used instead — if the Client
 * has no email on file either, registration can't proceed yet.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const email = parsed.data.email ? normalizeEmail(parsed.data.email) : undefined;
  const phone = parsed.data.phone ? normalizePhone(parsed.data.phone) : undefined;

  const client = await findMatchingCustomerClient(email, phone);
  if (!client) {
    return NextResponse.json(
      { error: "No matching account found for that email/phone. Please contact support." },
      { status: 404 }
    );
  }

  const existingAccount = await findCustomerAccountByContact(email, phone);
  if (existingAccount) {
    return NextResponse.json({ error: "Already registered — please log in instead." }, { status: 409 });
  }

  const deliveryEmail = resolveOtpDeliveryEmail(email, client);
  if (!deliveryEmail) {
    return NextResponse.json(
      { error: "Email verification isn't available for this account yet — please contact support." },
      { status: 422 }
    );
  }

  // Same key verify-otp will derive from the identical (email, phone) resubmission —
  // never the deliveryEmail fallback, which may differ from what the user actually typed.
  const contact = (email ?? phone) as string;
  try {
    const code = await createOtpChallenge(contact, "REGISTER");
    await sendOtpEmail(deliveryEmail, code, "REGISTER");
  } catch (err) {
    if (err instanceof OtpCooldownError) {
      return NextResponse.json({ error: err.message, retryAfterMs: err.retryAfterMs }, { status: 429 });
    }
    console.error("[customer register] failed to send OTP:", err);
    return NextResponse.json({ error: "Failed to send verification code. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ sentTo: deliveryEmail });
}
