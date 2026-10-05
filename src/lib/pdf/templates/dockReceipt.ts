import type { ShipmentDocumentData } from "@/lib/pdf/documentData";
import {
  BASE_PRINT_STYLES,
  COMPANY_LETTERHEAD,
  clientAddressHtml,
  escapeHtml,
  fmtNum,
  formatDate,
} from "@/lib/pdf/templates/shared";

/**
 * Dock Receipt.
 *
 * ASSUMPTION: the schema has no dedicated AES/ITN export-filing-number column,
 * so per the spec it is rendered from `otherReference` when present (labeled
 * "AES ITN / Export Filing #"), falling back to a blank hand-fill line.
 */
export function dockReceipt(data: ShipmentDocumentData): string {
  const { shipment, shipper, consignee } = data;

  const rows: string[] = [];
  for (const container of data.cargoContainers) {
    for (const item of container.items) {
      rows.push(`
        <tr>
          <td>${escapeHtml(container.containerNumber) || "&mdash;"}</td>
          <td>${escapeHtml(item.description) || ""}</td>
          <td class="num">${item.numberOfPieces ?? ""} ${escapeHtml(item.pieceType ?? "")}</td>
          <td class="num">${item.grossWeightLbs ? `${fmtNum(item.grossWeightLbs)} lbs` : ""}</td>
        </tr>
      `);
    }
  }
  if (rows.length === 0) {
    rows.push(`<tr><td colspan="4" class="no-cargo">No cargo items on file.</td></tr>`);
  }

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(shipment.fileNumber)} - Dock Receipt</title>
<style>
${BASE_PRINT_STYLES}
.no-cargo { text-align: center; color: #999; font-style: italic; }
</style>
</head>
<body>
  <div class="letterhead">
    <div>
      <div class="company-name">${escapeHtml(COMPANY_LETTERHEAD.name)}</div>
      <div class="company-addr">${escapeHtml(COMPANY_LETTERHEAD.addressLine1)}<br/>${escapeHtml(COMPANY_LETTERHEAD.addressLine2)}<br/>${escapeHtml(COMPANY_LETTERHEAD.phone)}</div>
    </div>
  </div>

  <div class="title-bar">
    <h1>DOCK RECEIPT</h1>
    <div><span class="field-label">File #:</span> ${escapeHtml(shipment.fileNumber)}</div>
  </div>

  <div class="two-col">
    <div>
      <div class="field-label">Place of Receipt</div>
      <div class="field-value">${escapeHtml(shipment.placeOfReceipt) || "&mdash;"}</div>
      <div class="field-label">Place of Delivery</div>
      <div class="field-value">${escapeHtml(shipment.placeOfDelivery) || "&mdash;"}</div>
      <div class="field-label">Ship Date</div>
      <div class="field-value">${escapeHtml(formatDate(shipment.shipAt)) || "&mdash;"}</div>
      <div class="field-label">AES ITN / Export Filing #</div>
      <div class="field-value">${shipment.otherReference ? escapeHtml(shipment.otherReference) : '<span class="blank-field"></span>'}</div>
    </div>
    <div>
      <div class="party-block">
        <div class="party-title">Shipper</div>
        ${clientAddressHtml(shipper)}
      </div>
      <div class="party-block">
        <div class="party-title">Consignee</div>
        ${clientAddressHtml(consignee)}
      </div>
    </div>
  </div>

  <table class="cargo-table">
    <thead>
      <tr>
        <th>Container</th>
        <th>Description</th>
        <th class="num">Pieces</th>
        <th class="num">Weight</th>
      </tr>
    </thead>
    <tbody>
      ${rows.join("\n")}
    </tbody>
  </table>
</body>
</html>`;
}
