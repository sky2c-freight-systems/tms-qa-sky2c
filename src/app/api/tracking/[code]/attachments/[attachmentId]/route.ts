import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTicketAttachments, downloadTicketAttachment, isCustomerVisibleAttachment } from "@/lib/zohoDeskApi";

/**
 * GET /api/tracking/[code]/attachments/[attachmentId]
 *
 * Public download, filtered to the same PICKUP_ZOHO/BOL_SIGNED_* convention as the
 * tracking page/route this mirrors (see isCustomerVisibleAttachment) — re-lists the
 * ticket's attachments and checks the id is both real AND customer-visible before
 * streaming, so this can't be used to fetch an arbitrary/internal-only attachment even
 * if its id were guessed.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string; attachmentId: string }> }
) {
  const { code: rawCode, attachmentId } = await params;
  const code = rawCode.trim();
  if (!code) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ?view=1 renders inline (browser's native PDF/image viewer) for the tracking page's
  // "View" action; the default stays a forced download for the "Download" action.
  const inline = new URL(request.url).searchParams.get("view") === "1";

  let shipment = await prisma.domesticWarehouseShipment.findUnique({ where: { fileNumber: code } });
  if (!shipment) {
    const sync = await prisma.zohoSync.findFirst({
      where: { zohoTicketNumber: code, fileNumber: { not: null } },
      select: { fileNumber: true },
    });
    if (sync?.fileNumber) {
      shipment = await prisma.domesticWarehouseShipment.findUnique({ where: { fileNumber: sync.fileNumber } });
    }
  }
  if (!shipment || !shipment.isActive) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sync = await prisma.zohoSync.findFirst({
    where: { fileNumber: shipment.fileNumber },
    select: { zohoTicketId: true },
  });
  if (!sync?.zohoTicketId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const attachments = await getTicketAttachments(sync.zohoTicketId);
    const match = attachments.find((a) => a.id === attachmentId && isCustomerVisibleAttachment(a.name));
    if (!match) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const file = await downloadTicketAttachment(sync.zohoTicketId, attachmentId);
    return new NextResponse(new Uint8Array(file.buffer), {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${file.filename}"`,
      },
    });
  } catch (err) {
    console.error(`[tracking] attachment download failed for ${code}/${attachmentId}:`, err);
    return NextResponse.json({ error: "Failed to download attachment" }, { status: 502 });
  }
}
