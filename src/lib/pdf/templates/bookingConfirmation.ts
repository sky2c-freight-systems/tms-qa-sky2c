import type { ShipmentDocumentData } from "@/lib/pdf/documentData";
import { formatCents } from "@/lib/money";
import {
  BASE_PRINT_STYLES,
  COMPANY_LETTERHEAD,
  clientAddressHtml,
  escapeHtml,
  fmtNum,
  formatDate,
} from "@/lib/pdf/templates/shared";

/** Booking Confirmation — a short confirmation-style document sent to the customer/carrier. */
export function bookingConfirmation(data: ShipmentDocumentData): string {
  const { shipment, shipper, consignee, carrier } = data;

  let totalPieces = 0;
  let totalWeightLbs = 0;
  for (const container of data.cargoContainers) {
    for (const item of container.items) {
      totalPieces += item.numberOfPieces ?? 0;
      totalWeightLbs += item.grossWeightLbs ?? 0;
    }
  }

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(shipment.fileNumber)} - Booking Confirmation</title>
<style>${BASE_PRINT_STYLES}</style>
</head>
<body>
  <div class="letterhead">
    <div>
      <div class="company-name">${escapeHtml(COMPANY_LETTERHEAD.name)}</div>
      <div class="company-addr">${escapeHtml(COMPANY_LETTERHEAD.addressLine1)}<br/>${escapeHtml(COMPANY_LETTERHEAD.addressLine2)}<br/>${escapeHtml(COMPANY_LETTERHEAD.phone)}</div>
    </div>
  </div>

  <div class="title-bar">
    <h1>BOOKING CONFIRMATION</h1>
    <div><span class="field-label">File #:</span> ${escapeHtml(shipment.fileNumber)}</div>
  </div>

  <div class="two-col">
    <div>
      <div class="field-label">Carrier</div>
      <div class="field-value">${escapeHtml(carrier?.name) || "&mdash;"}</div>
      <div class="field-label">Origin</div>
      <div class="field-value">${escapeHtml(shipment.origin) || "&mdash;"}</div>
      <div class="field-label">Destination</div>
      <div class="field-value">${escapeHtml(shipment.destination) || "&mdash;"}</div>
      <div class="field-label">Service Level</div>
      <div class="field-value">${escapeHtml(shipment.serviceLevel) || escapeHtml(shipment.typeOfService) || "&mdash;"}</div>
    </div>
    <div>
      <div class="field-label">Ship Date</div>
      <div class="field-value">${escapeHtml(formatDate(shipment.shipAt)) || "&mdash;"}</div>
      <div class="field-label">ETA</div>
      <div class="field-value">${escapeHtml(formatDate(shipment.etaAt)) || "&mdash;"}</div>
      <div class="field-label">PRO / Booking #</div>
      <div class="field-value">${escapeHtml(shipment.proNumber) || "&mdash;"}</div>
      <div class="field-label">Total Charges</div>
      <div class="field-value">${shipment.totalChargesCents != null ? escapeHtml(formatCents(shipment.totalChargesCents)) : "&mdash;"}</div>
    </div>
  </div>

  <div class="two-col">
    <div class="party-block">
      <div class="party-title">Shipper</div>
      ${clientAddressHtml(shipper)}
    </div>
    <div class="party-block">
      <div class="party-title">Consignee</div>
      ${clientAddressHtml(consignee)}
    </div>
  </div>

  <table class="cargo-table">
    <thead>
      <tr>
        <th>Description</th>
        <th class="num">Containers</th>
        <th class="num">Pieces</th>
        <th class="num">Weight</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${escapeHtml(shipment.cargoDescription) || "&mdash;"}</td>
        <td class="num">${data.cargoContainers.length}</td>
        <td class="num">${totalPieces || ""}</td>
        <td class="num">${totalWeightLbs ? `${fmtNum(totalWeightLbs)} lbs` : ""}</td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
}
