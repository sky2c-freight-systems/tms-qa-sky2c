import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

/** Read-only single ZohoSync row lookup by zohoTicketId. Real session auth (401 on failure). */
export async function GET(_request: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { ticketId } = await params;
  const row = await prisma.zohoSync.findUnique({ where: { zohoTicketId: ticketId } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: row });
}
