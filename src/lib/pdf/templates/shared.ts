import type { Client } from "@prisma/client";
import { buildPrintableAddress } from "@/lib/clientService";

/**
 * Brand colors (from the VHAUL4U logo) and the branded header/footer banner
 * used on print documents (quote, BOL). NOTE: the header is a solid-color
 * banner, not the truck-photo background used on the reference letterhead —
 * we don't have that photo asset. Drop a JPG/PNG at public/header-truck.jpg
 * and swap BRAND.headerBackground below to
 * `url('data:image/jpeg;base64,...')` (Puppeteer needs a data URI, not a
 * relative path, since it renders a standalone HTML string) to add it.
 */
export const BRAND = {
  navy: "#0d2946",
  red: "#e30613",
  gray: "#7f93a3",
};

/** VHAUL4U logo, navy wordmark + red icon — for use on white/light backgrounds. */
export const LOGO_SVG_DARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 491.69 95.87" style="height:100%">
<path fill="${BRAND.red}" d="M50.93.17L12.26,31.51l.07.07h-.1L1.23,78.77l-1.23,5.25h25.01c-.1-1.67-.03-3.44.24-5.25.1-.61.2-1.26.37-1.91,3.1-13.29,16.39-24.09,29.71-24.09,8.31,0,14.65,4.19,17.51,10.6h7.22l1.87-8.01,9.88-42.35,1.09-4.84.85-3.61,1.06-4.39h-43.88ZM71.48,45.04c-4.02-2.11-8.79-3.3-14.14-3.3-17.44,0-34.89,12.74-41.46,29.44l7.97-34.27v-.03l29.4-23.85h25.69l-7.46,32.02Z"/>
<path fill="${BRAND.red}" d="M110.62,71.17l-3,12.84h-36.56c.92-1.67,1.67-3.44,2.25-5.25.2-.61.34-1.26.51-1.91.44-1.94.65-3.82.65-5.62h34.85l.03-.07h1.26Z"/>
<path fill="${BRAND.red}" d="M67.83,77.61c-.07.37-.17.78-.31,1.16-2.82,9.57-12.53,17.1-22.24,17.1s-15.88-7.53-14.24-17.1c.03-.38.13-.79.2-1.16,2.35-10.12,12.47-18.3,22.55-18.3s16.39,8.18,14.04,18.3Z"/>
<path fill="${BRAND.navy}" d="M119.27,16.71l6,35.71c.08.53.38.68.68.68s.68-.15.99-.68l20.89-35.71h15.35l-28.64,44.83c-2.96,4.63-6.38,6.76-11.93,6.76s-7.98-2.36-8.97-6.84l-9.73-44.75h15.35Z"/>
<path fill="${BRAND.navy}" d="M181.41,16.71l-4.25,20.13h23.86l4.25-20.13h13.37l-10.79,50.91h-13.37l4.25-20.13h-23.86l-4.25,20.13h-13.37l10.79-50.91h13.37Z"/>
<path fill="${BRAND.navy}" d="M253.36,16.02c5.47,0,7.98,2.13,8.97,6.76l9.65,44.83h-15.35l-1.52-9.27h-21.58l-5.47,9.27h-15.35l28.72-44.75c3.04-4.71,6.31-6.84,11.93-6.84ZM253.44,47.71l-2.58-15.8c-.08-.46-.3-.68-.68-.68s-.76.3-.99.68l-9.35,15.8h13.6Z"/>
<path fill="${BRAND.navy}" d="M298.41,16.71l-6.46,30.7c-1.06,4.94,1.14,9.8,8.66,9.8s11.78-4.86,12.84-9.8l6.46-30.7h13.37l-6.38,30.32c-3.12,14.66-16.56,21.27-28.64,21.27s-22.79-6.23-19.6-21.27l6.38-30.32h13.37Z"/>
<path fill="${BRAND.navy}" d="M354.78,16.71l-7.83,36.85c-.46,2.13.61,3.42,2.81,3.42h26.59l-2.28,10.64h-30.47c-8.43,0-11.7-5.93-10.49-11.62l8.28-39.28h13.37Z"/>
<path fill="${BRAND.gray}" d="M427.34,35.85l-2.51,11.78h4.71l-2.28,10.64h-4.71l-1.98,9.35h-13.37l1.98-9.35h-28.87l2.28-10.64,31.46-30.92h15.04l-31.15,30.7-.08.23h13.6l2.51-11.78h13.37Z"/>
<path fill="${BRAND.gray}" d="M456.81,16.71l-6.46,30.7c-1.06,4.94,1.14,9.8,8.66,9.8s11.78-4.86,12.84-9.8l6.46-30.7h13.37l-6.38,30.32c-3.12,14.66-16.56,21.27-28.64,21.27s-22.79-6.23-19.6-21.27l6.38-30.32h13.37Z"/>
</svg>`;

/** Same logo with the wordmark in white — for use on the navy header/footer banners. */
export const LOGO_SVG_LIGHT = LOGO_SVG_DARK.replace(new RegExp(BRAND.navy, "g"), "#ffffff").replace(
  new RegExp(BRAND.gray, "g"),
  "#dbe2e7"
);

/** Just the red truck-mark icon (no wordmark), for tight spaces like the footer line. */
export const LOGO_MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 111 96" style="height:100%">
<path fill="${BRAND.red}" d="M50.93.17L12.26,31.51l.07.07h-.1L1.23,78.77l-1.23,5.25h25.01c-.1-1.67-.03-3.44.24-5.25.1-.61.2-1.26.37-1.91,3.1-13.29,16.39-24.09,29.71-24.09,8.31,0,14.65,4.19,17.51,10.6h7.22l1.87-8.01,9.88-42.35,1.09-4.84.85-3.61,1.06-4.39h-43.88ZM71.48,45.04c-4.02-2.11-8.79-3.3-14.14-3.3-17.44,0-34.89,12.74-41.46,29.44l7.97-34.27v-.03l29.4-23.85h25.69l-7.46,32.02Z"/>
<path fill="${BRAND.red}" d="M110.62,71.17l-3,12.84h-36.56c.92-1.67,1.67-3.44,2.25-5.25.2-.61.34-1.26.51-1.91.44-1.94.65-3.82.65-5.62h34.85l.03-.07h1.26Z"/>
<path fill="${BRAND.red}" d="M67.83,77.61c-.07.37-.17.78-.31,1.16-2.82,9.57-12.53,17.1-22.24,17.1s-15.88-7.53-14.24-17.1c.03-.38.13-.79.2-1.16,2.35-10.12,12.47-18.3,22.55-18.3s16.39,8.18,14.04,18.3Z"/>
</svg>`;

/** Full-width branded banner used at the top of print documents. */
export function brandedHeader(): string {
  return `<div class="brand-header">
    <div class="brand-header-tagline">TOUGH LOADS<br/>SIMPLY HAULED</div>
    <div class="brand-header-logo">${LOGO_SVG_LIGHT}</div>
  </div>`;
}

/** Full-width branded banner used at the bottom of print documents. */
export function brandedFooter(): string {
  return `<div class="brand-footer">
    <div class="brand-footer-tagline">
      <span class="brand-footer-logo">${LOGO_MARK_SVG}</span>
      WE ARE READY<br/>TO HAUL FOR YOU
    </div>
    <div class="brand-footer-contact">
      <div>${escapeHtml(COMPANY_LETTERHEAD.footerAddress)}</div>
      <div>${escapeHtml(COMPANY_LETTERHEAD.email)}</div>
    </div>
  </div>`;
}

/**
 * Chromium's print engine clips anything outside the printable area — a
 * negative margin can't "bleed" a banner past the @page margin like it would
 * in a browser window. So for documents using these branded banners, the
 * page margin is set to 0 here and moved onto a `.page-content` wrapper div
 * instead (see brandedDocument() below), leaving the header/footer free to
 * span the full physical page width edge-to-edge.
 */
export const BRAND_HEADER_FOOTER_STYLES = `
  @page { margin: 0; }
  body { margin: 0; }
  /* Reserve space for the fixed header/footer bands below so real content
     never lands underneath them; fixed-position elements repeat on every
     printed page in Chromium, which is what pins the footer to the bottom
     of whichever page it ends up on instead of overflowing onto a mostly
     blank extra page. */
  .page-content { padding: 1in 0.5in; }
  .brand-header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: ${BRAND.navy};
    padding: 14px 0.5in;
  }
  .brand-header-tagline {
    color: #fff;
    font-size: 9pt;
    font-weight: bold;
    font-style: italic;
    letter-spacing: 0.5px;
    line-height: 1.3;
  }
  .brand-header-logo { height: 34px; flex-shrink: 0; }
  .brand-header-logo svg { display: block; height: 100%; width: auto; }
  .brand-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: ${BRAND.navy};
    padding: 14px 0.5in;
  }
  .brand-footer-tagline {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #fff;
    font-size: 9pt;
    font-weight: bold;
    font-style: italic;
    line-height: 1.3;
  }
  .brand-footer-logo { height: 22px; flex-shrink: 0; }
  .brand-footer-logo svg { display: block; height: 100%; width: auto; }
  .brand-footer-contact { color: #fff; font-size: 8pt; text-align: right; line-height: 1.6; flex-shrink: 0; }
`;

/**
 * Small helpers shared by all five document templates so letterhead, address
 * formatting, and print-pagination CSS only exist in one place.
 *
 * ASSUMPTION: the legacy spec didn't include real company letterhead details
 * (name/address/logo), so `COMPANY_LETTERHEAD` below is a clearly-labeled
 * placeholder. Swap it for the real company identity when available.
 */
export const COMPANY_LETTERHEAD = {
  name: "VHAUL4U",
  addressLine1: "1500 Atlantic St., Union City",
  addressLine2: "California, United States 94587",
  phone: "(800) 555-0100",
  email: "sales@vhaul4u.us",
  footerAddress: "711 E Rosecrans Avenue, Los Angeles, CA 90221",
};

export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Format a Date (or null) as e.g. "Jul 11, 2026". */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "2-digit" }).format(d);
}

export function nbsp(value: string): string {
  return value.length > 0 ? value : "&nbsp;";
}

/** Renders a labeled multi-line client address block, or a blank placeholder if the client is missing. */
export function clientAddressHtml(client: Client | null): string {
  if (!client) return `<div class="addr-empty">&mdash;</div>`;
  const printable = client.printableAddress?.trim() || buildPrintableAddress(client.name, client);
  const lines = printable.split("\n").map((line) => escapeHtml(line));
  const contactBits = [
    client.contact ? `Attn: ${escapeHtml(client.contact)}` : null,
    client.telephone ? `Tel: ${escapeHtml(client.telephone)}` : null,
  ].filter((v): v is string => !!v);
  return [
    `<div class="addr-name">${lines[0] ?? ""}</div>`,
    ...lines.slice(1).map((line) => `<div class="addr-line">${line}</div>`),
    ...contactBits.map((bit) => `<div class="addr-line addr-contact">${bit}</div>`),
  ].join("");
}

export function fmtNum(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined) return "";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/**
 * Shared print CSS. Pagination is handled entirely by the browser's print
 * engine (see src/lib/pdf/renderToPdf.ts comment): `@page` sets margins/size,
 * cargo table `<thead>` repeats via `display: table-header-group`, and every
 * `<tr>` gets `break-inside: avoid` so rows never split across a page.
 */
export const BASE_PRINT_STYLES = `
  @page { size: Letter; margin: 0.5in; }
  * { box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10pt;
    color: #111;
    margin: 0;
  }
  h1, h2, h3 { margin: 0; }
  table { width: 100%; border-collapse: collapse; }
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  .letterhead {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 3px solid #002946;
    padding-bottom: 8px;
    margin-bottom: 10px;
  }
  .letterhead .company-name { font-size: 15pt; font-weight: bold; color: #002946; }
  .letterhead .company-addr { font-size: 8.5pt; color: #333; }
  .letterhead .qr-box { text-align: center; }
  .letterhead .qr-box img { width: 90px; height: 90px; }
  .letterhead .qr-box .qr-caption { font-size: 7pt; color: #555; margin-top: 2px; }
  .title-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #002946;
    color: #fff;
    padding: 6px 10px;
    margin-bottom: 10px;
    border: 1px solid #002946;
  }
  .title-bar h1 { color: #fff; }
  .title-bar h1 { font-size: 13pt; letter-spacing: 0.5px; }
  .two-col {
    display: flex;
    gap: 12px;
    margin-bottom: 10px;
  }
  .two-col > div { flex: 1; border: 1px solid #999; padding: 6px 8px; }
  .field-label { font-size: 7.5pt; text-transform: uppercase; color: #555; font-weight: bold; }
  .field-value { font-size: 9.5pt; margin-bottom: 4px; }
  .party-block { border: 1px solid #999; padding: 6px 8px; margin-bottom: 8px; }
  .party-block .party-title { font-size: 8pt; text-transform: uppercase; font-weight: bold; color: #555; margin-bottom: 3px; }
  .addr-name { font-weight: bold; }
  .addr-line { font-size: 9pt; }
  .addr-empty { color: #999; }
  .cargo-table th, .cargo-table td {
    border: 1px solid #999;
    padding: 4px 6px;
    font-size: 8.5pt;
    text-align: left;
    vertical-align: top;
  }
  .cargo-table th { background: #e4e6e8; color: #002946; }
  .cargo-table td.num, .cargo-table th.num { text-align: right; }
  .totals-row td { font-weight: bold; background: #f5f7f7; }
  .boilerplate { font-size: 7.5pt; color: #333; margin-top: 10px; line-height: 1.4; }
  .boilerplate h3 { font-size: 8.5pt; margin-bottom: 3px; }
  .sig-line {
    margin-top: 20px;
    display: flex;
    gap: 24px;
  }
  .sig-line .sig-field { flex: 1; border-top: 1px solid #111; padding-top: 3px; font-size: 8pt; }
  .arrival-block {
    margin-top: 16px;
    border: 1px solid #999;
    padding: 8px;
  }
  .arrival-block .arrival-title { font-weight: bold; font-size: 9pt; margin-bottom: 6px; }
  .arrival-grid { display: flex; gap: 16px; }
  .arrival-grid > div { flex: 1; }
  .blank-field { border-bottom: 1px solid #333; display: inline-block; min-width: 120px; height: 14px; }
`;
