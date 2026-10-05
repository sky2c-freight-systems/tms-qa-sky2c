import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { ShipmentNotFoundError } from "@/lib/pdf/documentData";
import { renderDocumentHtml, renderDocumentPdf } from "@/lib/pdf/renderDocument";
import { isDocType } from "@/lib/pdf/documentTypes";

interface RouteParams {
  params: Promise<{ fileNumber: string; docType: string }>;
}

/**
 * GET /api/shipments/[fileNumber]/documents/[docType]?format=pdf|html
 *
 * `format=html` (default) returns the raw HTML for on-screen preview (e.g.
 * an <iframe>). `format=pdf` renders the same HTML through the shared
 * Puppeteer pipeline and streams back a PDF — used for both the "Save as
 * PDF" download link and the browser Print flow.
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { fileNumber, docType } = await params;

  if (!isDocType(docType)) {
    return NextResponse.json({ error: `Unknown document type: ${docType}` }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "html";

  try {
    if (format === "pdf") {
      const { pdf } = await renderDocumentPdf(fileNumber, docType);
      return new NextResponse(new Uint8Array(pdf), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${fileNumber}_${docType}.pdf"`,
        },
      });
    }

    const { html } = await renderDocumentHtml(fileNumber, docType);
    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    if (err instanceof ShipmentNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error(`[documents/${docType}] render failed for ${fileNumber}:`, err);
    return NextResponse.json({ error: "Failed to render document" }, { status: 500 });
  }
}
