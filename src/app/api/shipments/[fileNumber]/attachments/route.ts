import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getTicketAttachments, isCustomerVisibleAttachment } from "@/lib/zohoDeskApi";

/**
 * GET /api/shipments/[fileNumber]/attachments[?visibleOnly=1]
 *
 * Internal, authenticated listing of attachments on the Zoho Desk ticket that originated
 * this shipment. By default every attachment (this page is staff-only, unlike the public
 * tracking endpoint). `?visibleOnly=1` narrows to the same PICKUP_ZOHO/BOL_SIGNED_*
 * convention the tracking page uses — the invoice view (BillingClient.tsx) uses this so
 * it only surfaces the documents relevant to that invoice, not every internal file on
 * the ticket. Returns an empty list rather than 404 when the shipment isn't tied to a
 * ticket, since "no attachments" is the correct state, not an error.
 */
export async function GET(request: Request, { params }: { params: Promise<{ fileNumber: string }> }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { fileNumber } = await params;
  const visibleOnly = new URL(request.url).searchParams.get("visibleOnly") === "1";
  const sync = await prisma.zohoSync.findFirst({ where: { fileNumber }, select: { zohoTicketId: true } });
  if (!sync?.zohoTicketId) {
    return NextResponse.json({ data: [] });
  }

  try {
    const attachments = await getTicketAttachments(sync.zohoTicketId);
    const data = visibleOnly ? attachments.filter((a) => isCustomerVisibleAttachment(a.name)) : attachments;
    return NextResponse.json({ data });
  } catch (err) {
    console.error(`[attachments] failed to list for ${fileNumber}:`, err);
    return NextResponse.json({ error: "Failed to load attachments from Zoho" }, { status: 502 });
  }
}
