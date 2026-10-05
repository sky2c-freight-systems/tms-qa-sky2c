import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/session";
import { ShipmentNotFoundError } from "@/lib/pdf/documentData";
import { renderDocumentPdf } from "@/lib/pdf/renderDocument";
import { docTypeLabel, isDocType } from "@/lib/pdf/documentTypes";
import { sendMail } from "@/lib/mailer";

interface RouteParams {
  params: Promise<{ fileNumber: string; docType: string }>;
}

const bodySchema = z.object({
  copies: z.number().int().positive().optional(),
});

/**
 * POST /api/shipments/[fileNumber]/documents/[docType]/email
 * Body: { copies?: number } — accepted for parity with Print/Save as PDF, unused for email.
 *
 * Emails the rendered PDF to the shipment's Account client's emailAddress.
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { fileNumber, docType } = await params;

  if (!isDocType(docType)) {
    return NextResponse.json({ error: `Unknown document type: ${docType}` }, { status: 400 });
  }

  const parsedBody = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const { pdf, data } = await renderDocumentPdf(fileNumber, docType);

    const recipient = data.account?.emailAddress;
    if (!recipient) {
      return NextResponse.json(
        { error: "This shipment's Account client has no email address on file" },
        { status: 400 }
      );
    }

    const label = docTypeLabel(docType);
    await sendMail({
      to: recipient,
      subject: `${fileNumber}_${label}`,
      text: `Please find the ${label} for file ${fileNumber} attached.`,
      attachments: [
        {
          filename: `${fileNumber}_${docType}.pdf`,
          content: pdf,
          contentType: "application/pdf",
        },
      ],
    });

    return NextResponse.json({ sent: true });
  } catch (err) {
    if (err instanceof ShipmentNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error(`[documents/${docType}/email] failed for ${fileNumber}:`, err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
