import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/customerSession";

/** GET /api/customer/me — who's logged in, for the portal header/profile menu. */
export async function GET() {
  let session;
  try {
    session = await requireCustomerSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const [account, client] = await Promise.all([
    session.customerAccountId
      ? prisma.customerAccount.findUnique({ where: { id: session.customerAccountId } })
      : null,
    session.clientId ? prisma.client.findUnique({ where: { id: session.clientId } }) : null,
  ]);

  const contactName = [client?.contact, client?.contactLastName].filter(Boolean).join(" ") || null;

  return NextResponse.json({
    data: {
      email: account?.email ?? null,
      phone: account?.phone ?? null,
      clientName: client?.name ?? null,
      contactName,
      clientPhone: client?.telephone ?? null,
    },
  });
}
