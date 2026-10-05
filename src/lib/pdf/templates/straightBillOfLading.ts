import type { ShipmentDocumentData } from "@/lib/pdf/documentData";
import { generateQrCodeDataUrl } from "@/lib/pdf/qrcode";
import {
  BASE_PRINT_STYLES,
  BRAND_HEADER_FOOTER_STYLES,
  COMPANY_LETTERHEAD,
  brandedHeader,
  brandedFooter,
  clientAddressHtml,
  escapeHtml,
  fmtNum,
  formatDate,
} from "@/lib/pdf/templates/shared";

/**
 * Straight Bill of Lading — the flagship document.
 *
 * Field-mapping assumptions (schema has no dedicated columns for these legacy
 * BOL fields):
 * - "Special Handling" has no backing field; rendered as a blank hand-fill line.
 * - "Remarks" is mapped to `shipment.cargoDescription`, the closest free-text field.
 * - The cargo table has no dedicated hazmat flag on CargoItem, so the "HM"
 *   column is rendered as a blank checkbox for hand-marking, matching how the
 *   legacy form used it.
 * - "Dimensions" is rendered as cubic feet (`grossSizeCft`), the only
 *   size/volume field CargoItem actually has (no L/W/H columns exist).
 *
 * Pagination: no JS pagination hack. The cargo table is one long HTML table;
 * `thead` repeats per page and every `tr` has break-inside:avoid (see
 * src/lib/pdf/renderToPdf.ts and templates/shared.ts for the shared CSS).
 */
export async function straightBillOfLading(data: ShipmentDocumentData): Promise<string> {
  const { shipment, shipper, consignee, carrier, cargoContainers } = data;

  const qrDataUrl = await generateQrCodeDataUrl(`DWTMS:${shipment.fileNumber}`);

  let totalPieces = 0;
  let totalWeightLbs = 0;
  let totalCft = 0;

  const cargoRows: string[] = [];
  for (const container of cargoContainers) {
    const containerLabel = [
      container.containerNumber ? `Container: ${escapeHtml(container.containerNumber)}` : "Container: (unassigned)",
      container.containerType ? `Type: ${escapeHtml(container.containerType)}` : null,
      [container.seal1, container.seal2, container.seal3].filter(Boolean).length > 0
        ? `Seals: ${[container.seal1, container.seal2, container.seal3].filter(Boolean).map(escapeHtml).join(" / ")}`
        : null,
      container.grossWeightLbs ? `Gross: ${fmtNum(container.grossWeightLbs)} lbs` : null,
    ]
      .filter(Boolean)
      .join(" &nbsp;&bull;&nbsp; ");

    cargoRows.push(
      `<tr><td colspan="5" class="container-subhead">${containerLabel}</td></tr>`
    );

    for (const item of container.items) {
      totalPieces += item.numberOfPieces ?? 0;
      totalWeightLbs += item.grossWeightLbs ?? 0;
      totalCft += item.grossSizeCft ?? 0;

      const description = item.isVehicle
        ? [
            "Vehicle",
            item.vehicleMake,
            item.vehicleModel,
            item.vehicleTitle ? `Title# ${item.vehicleTitle}` : null,
            item.vehicleState,
          ]
            .filter(Boolean)
            .map(escapeHtml)
            .join(" ")
        : escapeHtml(item.description ?? "");

      cargoRows.push(`
        <tr>
          <td class="num">${item.numberOfPieces ?? ""} ${escapeHtml(item.pieceType ?? "")}</td>
          <td class="num hm-cell"><span class="checkbox"></span></td>
          <td>${description}</td>
          <td class="num">${item.grossWeightLbs ? `${fmtNum(item.grossWeightLbs)} lbs` : ""}</td>
          <td class="num">${item.grossSizeCft ? `${fmtNum(item.grossSizeCft, 2)} cft` : ""}</td>
        </tr>
      `);
    }
  }

  if (cargoRows.length === 0) {
    cargoRows.push(`<tr><td colspan="5" class="no-cargo">No cargo items on file.</td></tr>`);
  }

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(shipment.fileNumber)} - Straight Bill of Lading</title>
<style>
${BASE_PRINT_STYLES}
${BRAND_HEADER_FOOTER_STYLES}
.container-subhead { background: #ddd; font-weight: bold; font-size: 8.5pt; }
.hm-cell { text-align: center; }
.checkbox { display: inline-block; width: 10px; height: 10px; border: 1px solid #333; }
.no-cargo { text-align: center; color: #999; font-style: italic; }
.liability-title { font-weight: bold; margin-top: 10px; }
</style>
</head>
<body>
  ${brandedHeader()}

  <div class="page-content">

  <div class="letterhead">
    <div>
      <div class="company-name">${escapeHtml(COMPANY_LETTERHEAD.name)}</div>
      <div class="company-addr">${escapeHtml(COMPANY_LETTERHEAD.addressLine1)}<br/>${escapeHtml(COMPANY_LETTERHEAD.addressLine2)}<br/>${escapeHtml(COMPANY_LETTERHEAD.phone)}</div>
    </div>
    <div class="qr-box">
      <img src="${qrDataUrl}" alt="QR code" />
      <div class="qr-caption">${escapeHtml(shipment.fileNumber)}</div>
    </div>
  </div>

  <div class="title-bar">
    <h1>STRAIGHT BILL OF LADING</h1>
    <div>
      <span class="field-label">Pickup Date:</span> ${escapeHtml(formatDate(shipment.shipAt)) || "&mdash;"}
      &nbsp;&nbsp;|&nbsp;&nbsp;
      <span class="field-label">Reference:</span> ${escapeHtml(shipment.fileNumber)}
    </div>
  </div>

  <div class="two-col">
    <div>
      <div class="field-label">Carrier</div>
      <div class="field-value">${escapeHtml(carrier?.name) || "&mdash;"}</div>
      <div class="field-label">Booking Number (PRO#)</div>
      <div class="field-value">${escapeHtml(shipment.proNumber) || "&mdash;"}</div>
      <div class="field-label">Special Handling</div>
      <div class="field-value"><span class="blank-field"></span></div>
      <div class="field-label">Remarks</div>
      <div class="field-value">${escapeHtml(shipment.cargoDescription) || "&mdash;"}</div>
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
      <div class="field-label">Customer Ref No.</div>
      <div class="field-value">${escapeHtml(shipment.otherReference) || "&mdash;"}</div>
    </div>
  </div>

  <table class="cargo-table">
    <thead>
      <tr>
        <th>Container / Units</th>
        <th class="num">HM</th>
        <th>Description</th>
        <th class="num">Weight</th>
        <th class="num">Cube</th>
      </tr>
    </thead>
    <tbody>
      ${cargoRows.join("\n")}
    </tbody>
    <tfoot>
      <tr class="totals-row">
        <td>${totalPieces || ""}</td>
        <td></td>
        <td>Totals</td>
        <td class="num">${totalWeightLbs ? `${fmtNum(totalWeightLbs)} lbs` : ""}</td>
        <td class="num">${totalCft ? `${fmtNum(totalCft, 2)} cft` : ""}</td>
      </tr>
    </tfoot>
  </table>

  <div class="boilerplate">
    <h3>Limitations on Liability</h3>
    <p>
      Unless otherwise agreed in writing, the carrier's liability for loss or damage to the property
      described in this Bill of Lading is limited to the released value declared by the shipper, or, in
      the absence of a declared value, to the maximum amount recoverable under applicable federal and
      state law governing the transportation of the described commodity. No carrier shall be liable for
      loss, damage, or delay caused by an act of God, the public enemy, the authority of law, an act or
      default of the shipper, or the natural shrinkage, leakage, or deterioration inherent in the goods
      shipped. Claims for loss, shortage, or damage must be filed in writing with the carrier within nine
      (9) months of delivery, or, in the case of failure to make delivery, within nine (9) months after a
      reasonable time for delivery has elapsed.
    </p>
    <h3>Common Carrier Liability</h3>
    <p>
      This is to certify that the above-named materials are properly classified, described, packaged,
      marked, and labeled, and are in proper condition for transportation according to the applicable
      regulations of the U.S. Department of Transportation. The property described above is received in
      apparent good order (except as otherwise noted) for transportation subject to the terms and
      conditions in effect on the date of issue of this Bill of Lading, which are available from the
      carrier on request and are hereby incorporated by reference. The carrier shall not make delivery of
      this shipment without payment of freight and all other lawful charges, unless otherwise noted
      herein.
    </p>
  </div>

  <div class="sig-line">
    <div class="sig-field">Shipper Signature / Date</div>
    <div class="sig-field">Carrier Signature / Date</div>
    <div class="sig-field">Consignee Signature / Date</div>
  </div>

  <div class="arrival-block">
    <div class="arrival-title">Driver / Loader Arrival &amp; Departure Record</div>
    <div class="arrival-grid">
      <div>
        <div class="field-label">Driver Name</div>
        <div class="field-value"><span class="blank-field"></span></div>
        <div class="field-label">Truck / Trailer #</div>
        <div class="field-value"><span class="blank-field"></span></div>
      </div>
      <div>
        <div class="field-label">Arrival Time</div>
        <div class="field-value"><span class="blank-field"></span></div>
        <div class="field-label">Departure Time</div>
        <div class="field-value"><span class="blank-field"></span></div>
      </div>
      <div>
        <div class="field-label">Driver Signature</div>
        <div class="field-value"><span class="blank-field"></span></div>
        <div class="field-label">Date</div>
        <div class="field-value"><span class="blank-field"></span></div>
      </div>
    </div>
  </div>

  </div>

  ${brandedFooter()}
</body>
</html>`;
}
