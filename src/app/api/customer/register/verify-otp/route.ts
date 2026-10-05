import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyOtpChallenge, normalizeEmail, normalizePhone } from "@/lib/otp";
import { findMatchingCustomerClient, findCustomerAccountByContact } from "@/lib/customerAccount";
import { getCustomerSession } from "@/lib/customerSession";

const bodySchema = z
  .object({
    email: z.string().trim().email().optional(),
    phone: z.string().trim().min(1).optional(),
    code: z.string().trim().length(6),
  })
  .refine((d) => d.email || d.phone, { message: "Enter an email or phone number." });

/**
 * POST /api/customer/register/verify-otp
 *
 * Re-resolves the matching Client fresh (rather than trusting anything from request-otp)
 * so a Client deactivated in the few minutes since the code was sent can't slip through.
 * On success, creates the CustomerAccount and logs the customer straight in.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const email = parsed.data.email ? normalizeEmail(parsed.data.email) : undefined;
  const phone = parsed.data.phone ? normalizePhone(parsed.data.phone) : undefined;
  const contact = (email ?? phone) as string;

  const ok = await verifyOtpChallenge(contact, "REGISTER", parsed.data.code);
  if (!ok) {
    return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });
  }

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

  const account = await prisma.customerAccount.create({
    data: { email, phone, clientId: client.id },
  });

  const session = await getCustomerSession();
  session.customerAccountId = account.id;
  session.clientId = client.id;
  session.email = account.email;
  await session.save();

  return NextResponse.json({ data: { clientName: client.name } });
}
