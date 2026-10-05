import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyOtpChallenge, normalizeEmail, normalizePhone } from "@/lib/otp";
import { getCustomerSession } from "@/lib/customerSession";
import { findCustomerAccountByContact } from "@/lib/customerAccount";

const bodySchema = z
  .object({
    email: z.string().trim().email().optional(),
    phone: z.string().trim().min(1).optional(),
    code: z.string().trim().length(6),
  })
  .refine((d) => d.email || d.phone, { message: "Enter an email or phone number." });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const email = parsed.data.email ? normalizeEmail(parsed.data.email) : undefined;
  const phone = parsed.data.phone ? normalizePhone(parsed.data.phone) : undefined;
  const contact = (email ?? phone) as string;

  const ok = await verifyOtpChallenge(contact, "LOGIN", parsed.data.code);
  if (!ok) {
    return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });
  }

  const account = await findCustomerAccountByContact(email, phone);
  if (!account || !account.isActive) {
    return NextResponse.json({ error: "Account not found or inactive." }, { status: 404 });
  }

  const client = await prisma.client.findUnique({ where: { id: account.clientId } });

  const session = await getCustomerSession();
  session.customerAccountId = account.id;
  session.clientId = account.clientId;
  session.email = account.email;
  await session.save();

  return NextResponse.json({ data: { clientName: client?.name ?? null } });
}
