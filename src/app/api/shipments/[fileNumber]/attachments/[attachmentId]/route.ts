import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { downloadTicketAttachment } from "@/lib/zohoDeskApi";

/**
 * GET /api/shipments/[fileNumber]/attachments/[attachmentId]
 *
 * Internal, authenticated download of a single Zoho Desk ticket attachment, streamed
 * through this server rather than redirecting to Zoho directly — the browser never needs
 * (and never gets) the Zoho access token.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileNumber: string; attachmentId: string }> }
) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { fileNumber, attachmentId } = await params;
  const inline = new URL(request.url).searchParams.get("view") === "1";
  const sync = await prisma.zohoSync.findFirst({ where: { fileNumber }, select: { zohoTicketId: true } });
  if (!sync?.zohoTicketId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const file = await downloadTicketAttachment(sync.zohoTicketId, attachmentId);
    return new NextResponse(new Uint8Array(file.buffer), {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${file.filename}"`,
      },
    });
  } catch (err) {
    console.error(`[attachments] download failed for ${fileNumber}/${attachmentId}:`, err);
    return NextResponse.json({ error: "Failed to download attachment" }, { status: 502 });
  }
}
