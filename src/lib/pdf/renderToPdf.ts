import puppeteer from "puppeteer";

/**
 * Single shared HTML -> PDF rendering pipeline. This replaces FIVE separate
 * hand-rolled iTextSharp HTML->PDF call sites in the legacy ASP.NET app (one
 * per document type), each with its own quirks.
 *
 * Pagination approach: we deliberately do NOT do any client-side/JS pagination
 * (the legacy Bill of Lading used a tilde-delimited-string JS hack to slice
 * cargo rows into "pages" before printing). Instead every template is a plain
 * HTML document with real CSS `@page` rules, and we let Chromium's print
 * engine paginate it: `<thead>` uses `display: table-header-group` so the
 * column headers repeat on every printed page, and every `<tr>` gets
 * `break-inside: avoid` so a row is never split across a page boundary. This
 * gives correct, browser-native pagination for cargo tables of any length
 * with no server-side row-chunking math to get wrong.
 */

export interface RenderHtmlToPdfOptions {
  format?: "Letter" | "A4";
  landscape?: boolean;
}

export async function renderHtmlToPdf(
  html: string,
  opts: RenderHtmlToPdfOptions = {}
): Promise<Buffer> {
  const { format = "Letter", landscape = false } = opts;

  // --no-sandbox/--disable-setuid-sandbox are required for Chromium to launch in a
  // container (no unprivileged user-namespace sandbox available there); harmless
  // outside a container, so applied unconditionally rather than gated on NODE_ENV.
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    // "load" is sufficient (and the only option `setContent` accepts) since
    // every template is fully self-contained — the QR code is an inline
    // base64 data URI, not an external image request.
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format,
      landscape,
      printBackground: true,
      preferCSSPageSize: true,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
