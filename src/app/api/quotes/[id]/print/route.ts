import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getQuoteDocumentData, QuoteNotFoundError } from "@/lib/pdf/quoteDocumentData";
import { quotePrintTemplate } from "@/lib/pdf/templates/quote";
import { renderHtmlToPdf } from "@/lib/pdf/renderToPdf";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/quotes/[id]/print?format=pdf|html
 *
 * `format=html` (default) returns raw HTML for on-screen preview (e.g. an
 * <iframe>). `format=pdf` renders the same HTML through the shared Puppeteer
 * pipeline and streams back a PDF — used for both "Save as PDF" and Print.
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "html";

  try {
    const data = await getQuoteDocumentData(id);
    const html = quotePrintTemplate(data);

    if (format === "pdf") {
      const pdf = await renderHtmlToPdf(html);
      return new NextResponse(new Uint8Array(pdf), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="quote_${data.quote.quoteNumber}.pdf"`,
        },
      });
    }

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    if (err instanceof QuoteNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error(`[quotes/${id}/print] render failed:`, err);
    return NextResponse.json({ error: "Failed to render quote" }, { status: 500 });
  }
}
