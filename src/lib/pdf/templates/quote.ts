import type { QuoteDocumentData } from "@/lib/pdf/quoteDocumentData";
import { formatCents } from "@/lib/money";
import { ACCESSORIAL_FLAGS } from "@/lib/quoteAccessorials";
import {
  BASE_PRINT_STYLES,
  BRAND_HEADER_FOOTER_STYLES,
  COMPANY_LETTERHEAD,
  brandedHeader,
  brandedFooter,
  escapeHtml,
  fmtNum,
  formatDate,
} from "@/lib/pdf/templates/shared";

/**
 * Quote print template — matches the VHAUL4U branded quote layout (navy/red
 * header+footer banner, light-band grouped sections). Independent from the
 * five shipment document templates (straightBillOfLading/etc.) since
 * DomesticWarehouseQuote is a full parallel entity, not a shipment variant.
 *
 * Two sections of the reference layout have no backing data field yet and are
 * intentionally left blank ("—") rather than fabricated:
 * - Cargo table: no Class/NMFC/Pallet-vs-Piece-count columns on QuoteCargoItem.
 * - Estimated Shipping Charges: no itemized charge-line/tax/adjustment fields
 *   on DomesticWarehouseQuote — only a single quotedAmountCents, shown as the
 *   Grand Total.
 */
export function quotePrintTemplate(data: QuoteDocumentData): string {
  const { quote, customer, carrier, cargoItems } = data;

  const activeFlags = ACCESSORIAL_FLAGS.filter(({ field }) => quote[field]);

  let totalPieces = 0;
  let totalWeightLbs = 0;
  let totalDeclaredValueCents = 0;
  for (const item of cargoItems) {
    totalPieces += item.numberOfPieces ?? 0;
    totalWeightLbs += item.grossWeightLbs ?? 0;
    totalDeclaredValueCents += item.declaredValueCents ?? 0;
  }

  const dash = "&mdash;";

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Quote #${escapeHtml(quote.quoteNumber)}</title>
<style>
${BASE_PRINT_STYLES}
${BRAND_HEADER_FOOTER_STYLES}
.band { background: #eef2f5; padding: 8px 10px; margin-bottom: 8px; }
.band-title { font-weight: bold; font-size: 9.5pt; color: #0d2946; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.3px; }
.plain-two-col { display: flex; gap: 24px; }
.plain-two-col > div { flex: 1; }
.charges-table th, .charges-table td { border: 1px solid #999; padding: 4px 6px; font-size: 8.5pt; text-align: left; }
.charges-table th { background: #e4e6e8; color: #0d2946; }
.charges-table td.num, .charges-table th.num { text-align: right; }
</style>
</head>
<body>
  ${brandedHeader()}

  <div class="page-content">

  <div class="band">
    <div class="plain-two-col">
      <div>
        <div class="company-name" style="font-size:14pt;font-weight:bold;color:#0d2946;">${escapeHtml(COMPANY_LETTERHEAD.name)}</div>
        <div style="font-size:8.5pt;color:#333;">${escapeHtml(COMPANY_LETTERHEAD.addressLine1)}<br/>${escapeHtml(COMPANY_LETTERHEAD.addressLine2)}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:14pt;font-weight:bold;color:#0d2946;">Quote</div>
        <div style="font-size:9pt;"><strong>Valid Until:</strong> ${escapeHtml(formatDate(quote.expirationDate)) || dash}</div>
        <div style="font-size:9pt;"><strong>Quote Number:</strong> ${escapeHtml(quote.quoteNumber)}</div>
      </div>
    </div>
  </div>

  <div class="band">
    <div class="plain-two-col">
      <div>
        <div class="band-title">Pick-Up Address</div>
        <div class="field-value">${escapeHtml(quote.pickupLocation) || dash}</div>
      </div>
      <div>
        <div class="band-title">Delivery Address</div>
        <div class="field-value">${escapeHtml(quote.dischargeLocation) || dash}</div>
        ${quote.finalDestination ? `<div class="field-value">Final Destination: ${escapeHtml(quote.finalDestination)}</div>` : ""}
      </div>
    </div>
  </div>

  <div class="band">
    <div class="plain-two-col">
      <div><strong>Pick-Up Date:</strong> ${escapeHtml(formatDate(quote.effectiveDate)) || dash}</div>
      <div><strong>ETD:</strong> ${escapeHtml(quote.transitTime) || dash}</div>
    </div>
  </div>

  <div class="band">
    <div class="plain-two-col">
      <div>
        <div style="font-size:9pt;margin-bottom:3px;"><strong>Account Name:</strong> ${escapeHtml(customer?.name) || dash}</div>
        <div style="font-size:9pt;margin-bottom:3px;"><strong>Contact Name:</strong> ${escapeHtml(quote.contactName) || dash}</div>
        <div style="font-size:9pt;"><strong>Email/Phone:</strong> ${[quote.contactEmail, quote.contactPhone].filter(Boolean).map((v) => escapeHtml(v)).join(" / ") || dash}</div>
      </div>
      <div>
        <div style="font-size:9pt;margin-bottom:3px;"><strong>Payment Terms:</strong> ${escapeHtml(quote.paymentTerms) || dash}</div>
        <div style="font-size:9pt;margin-bottom:3px;"><strong>Carrier:</strong> ${escapeHtml(carrier?.name) || dash}</div>
        <div style="font-size:9pt;"><strong>Quoted By:</strong> ${escapeHtml(quote.quotedBy) || dash}</div>
      </div>
    </div>
  </div>

  ${
    activeFlags.length > 0
      ? `<div class="band">
    <div class="band-title">Accessorials</div>
    <div>${activeFlags.map(({ label }) => `<span style="display:inline-block;border:1px solid #999;border-radius:3px;padding:1px 6px;margin:0 4px 4px 0;font-size:8.5pt;">${escapeHtml(label)}</span>`).join("")}</div>
  </div>`
      : ""
  }

  <div class="band-title" style="margin-top:6px;">Cargo Details</div>
  <table class="cargo-table">
    <thead>
      <tr>
        <th>Description</th>
        <th class="num">Qty</th>
        <th>Piece Type</th>
        <th class="num">Weight (lbs)</th>
        <th class="num">Volume (cft)</th>
        <th class="num">Declared Value</th>
      </tr>
    </thead>
    <tbody>
      ${
        cargoItems.length > 0
          ? cargoItems
              .map(
                (item) => `<tr>
        <td>${escapeHtml(item.description) || dash}</td>
        <td class="num">${item.numberOfPieces ?? ""}</td>
        <td>${escapeHtml(item.pieceType) || ""}</td>
        <td class="num">${item.grossWeightLbs != null ? fmtNum(item.grossWeightLbs, 2) : ""}</td>
        <td class="num">${item.grossSizeCft != null ? fmtNum(item.grossSizeCft, 2) : ""}</td>
        <td class="num">${item.declaredValueCents != null ? escapeHtml(formatCents(item.declaredValueCents)) : ""}</td>
      </tr>`
              )
              .join("")
          : `<tr><td colspan="6" style="text-align:center;color:#999;">No cargo line items</td></tr>`
      }
    </tbody>
    <tfoot>
      <tr class="totals-row">
        <td>Totals</td>
        <td class="num">${totalPieces || ""}</td>
        <td></td>
        <td class="num">${totalWeightLbs ? fmtNum(totalWeightLbs, 2) : ""}</td>
        <td></td>
        <td class="num">${totalDeclaredValueCents ? escapeHtml(formatCents(totalDeclaredValueCents)) : ""}</td>
      </tr>
    </tfoot>
  </table>

  <div class="band-title" style="margin-top:10px;">Estimated Shipping Charges</div>
  <table class="charges-table">
    <thead>
      <tr>
        <th>Item</th>
        <th class="num">Total</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Grand Total</td>
        <td class="num">${quote.quotedAmountCents != null ? escapeHtml(formatCents(quote.quotedAmountCents)) : dash}</td>
      </tr>
    </tbody>
  </table>

  <div class="boilerplate">
    <h3>Terms and Conditions</h3>
    <p>
      - Quotes are valid based on provided information and subject to reclassification.<br/>
      - Weight, dimensions, and freight class must be verified at pickup.<br/>
      - Transit times are estimated and not guaranteed.<br/>
      - Extra charges may apply for waiting time, missed pickup, or delivery attempts.<br/>
      - Fuel surcharges are subject to market fluctuations.<br/>
      - Insurance is not included unless requested.
    </p>
  </div>

  ${
    quote.convertedToFileNumber
      ? `<div class="boilerplate"><strong>Converted to Shipment File #:</strong> ${escapeHtml(quote.convertedToFileNumber)}</div>`
      : ""
  }

  <div class="sig-line">
    <div class="sig-field">Customer Acceptance / Signature</div>
    <div class="sig-field">Date</div>
  </div>

  </div>

  ${brandedFooter()}
</body>
</html>`;
}
