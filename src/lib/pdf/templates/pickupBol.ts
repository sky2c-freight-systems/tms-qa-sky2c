import type { PickupBolData } from "@/lib/pdf/pickupBolData";
import { escapeHtml } from "@/lib/pdf/templates/shared";

/**
 * Pickup Straight Bill of Lading for Dispatch shipments — laid out after Sky2C's paper
 * pickup BOL (boxed Carrier / Special Handling / Remarks on the left, Shipper / Consignee /
 * Customer Ref on the right, cargo table, then the liability, freight-charge, Bill To and
 * driver/loader signature blocks). Data comes from src/lib/pdf/pickupBolData.ts.
 */

const SKY2C_ADDRESS = ["SKY2C FREIGHT SYSTEMS INC.", "1500 Atlantic St.", "Union City, CA 94587", "Tel# 510-743-3300", "Fax: 510-743-3301"];

const SKY2C_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 64" style="height:100%">
  <path d="M0 8h26l24 24-24 24H0l24-24z" fill="#0b2545"/>
  <path d="M34 8h18l24 24-24 24H34l24-24z" fill="#0b2545" opacity=".85"/>
  <text x="92" y="50" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="900" font-style="italic" fill="#0b2545">SKY<tspan fill="#f26b21">2</tspan>C</text>
</svg>`;

function lines(values: string[]): string {
  return values.map((v) => escapeHtml(v)).join("<br/>");
}

function multiline(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, "<br/>");
}

export function pickupBol(data: PickupBolData): string {
  const rows = data.rows
    .map(
      (r) => `
      <tr>
        <td>${escapeHtml(r.units)}</td>
        <td class="c">${escapeHtml(r.hazmat)}</td>
        <td>${escapeHtml(r.description)}</td>
        <td class="r">${escapeHtml(r.weight)}</td>
        <td>${escapeHtml(r.dimensions)}</td>
      </tr>`
    )
    .join("");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>BOL ${escapeHtml(data.reference)}</title>
<style>
  @page { size: Letter; margin: 0.4in 0.45in; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #111; margin: 0; }
  .sheet { display: flex; flex-direction: column; min-height: 10.15in; }
  .title-row { display: grid; grid-template-columns: 1fr auto 1fr; align-items: end; border-bottom: 1.5px solid #111; padding-bottom: 2px; }
  .title-row h1 { grid-column: 2; margin: 0; font-size: 14pt; letter-spacing: .3px; }
  .title-row .ref { justify-self: end; font-size: 10pt; }
  .title-row .ref b { font-weight: normal; margin-left: 14px; font-size: 11pt; }
  .top { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #111; }
  .top > div:first-child { border-right: 1px solid #111; }
  .box { padding: 3px 8px 6px; min-height: 0.55in; }
  .box + .box { border-top: 1px solid #111; }
  .lbl { font-size: 7pt; color: #333; }
  .val { font-size: 10.5pt; line-height: 1.25; padding-left: 4px; text-transform: uppercase; }
  .tall { min-height: 1.15in; }
  .ref-box { min-height: 0.45in; }
  table.cargo { width: 100%; border-collapse: collapse; margin-top: 6px; }
  table.cargo th { border-top: 1.5px solid #111; border-bottom: 1px solid #111; font-size: 8.5pt; padding: 3px 4px; vertical-align: top; }
  table.cargo th + th { border-left: 1px solid #111; }
  table.cargo th small { display: block; font-weight: normal; font-size: 6.5pt; }
  table.cargo td { padding: 4px; font-size: 10pt; vertical-align: top; }
  .c { text-align: center; }
  .r { text-align: right; white-space: nowrap; }
  .cargo-space { flex: 1; min-height: 1in; }
  .foot { display: grid; grid-template-columns: 2.1fr 1.15fr 1.5fr 2fr; border: 1px solid #111; font-size: 6.4pt; line-height: 1.3; }
  .foot > div { padding: 4px 5px; }
  .foot > div + div { border-left: 1px solid #111; }
  .foot .sig { margin-top: 10px; text-align: center; font-size: 8pt; }
  .freight-title { text-align: center; font-size: 8.5pt; }
  .split { border-top: 1px solid #111; margin: 4px -5px 0; padding: 4px 5px 0; }
  .bill-to { font-size: 7pt; }
  .logo { height: 34px; margin: 6px 0 2px; }
  .addr { font-size: 8.5pt; line-height: 1.25; }
  .received { border: 1px solid #111; border-top: 0; padding: 3px 5px; font-size: 6.2pt; line-height: 1.3; }
  .lines { margin-top: 14px; font-size: 9pt; }
  .line-row { display: flex; gap: 24px; margin-top: 14px; }
  .line-row span.f { flex: 1; border-bottom: 1px solid #111; }
  .line-row .pair { display: flex; flex: 1; gap: 6px; align-items: flex-end; }
  .dhs { text-align: center; font-weight: bold; font-size: 9.5pt; margin-top: 10px; line-height: 1.3; }
</style>
</head>
<body>
<div class="sheet">
  <div class="title-row">
    <h1>STRAIGHT BILL OF LADING</h1>
    <div class="ref">Reference: <b>${escapeHtml(data.reference)}</b></div>
  </div>

  <div class="top">
    <div>
      <div class="box"><div class="lbl">Carrier</div><div class="val">${escapeHtml(data.carrier)}</div></div>
      <div class="box tall"><div class="lbl">Special Handling</div><div class="val">${lines(data.specialHandling)}</div></div>
      <div class="box tall"><div class="lbl">Remarks</div><div class="val">${lines(data.remarks)}</div></div>
    </div>
    <div>
      <div class="box tall"><div class="lbl">Shipper</div><div class="val">${multiline(data.shipper)}</div></div>
      <div class="box tall"><div class="lbl">Consignee</div><div class="val">${multiline(data.consignee)}</div></div>
      <div class="box ref-box"><div class="lbl">Customer Ref. No.</div><div class="val">${escapeHtml(data.customerRef)}</div></div>
    </div>
  </div>

  <table class="cargo">
    <thead>
      <tr>
        <th style="width:11%">No. of Units</th>
        <th style="width:7%">HM</th>
        <th style="width:38%">BASIC DESCRIPTION<small>Proper Shipping Name, Hazard Class<br/>Identification Number (UN or NA), Packaging Group</small></th>
        <th style="width:14%">WEIGHT<small>(Subject to Correction)</small></th>
        <th style="width:30%">DIMENSIONS<small>(Subject to Correction)</small></th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="cargo-space"></div>

  <div class="foot">
    <div>
      LIMITATIONS ON LIABILITY: In consideration of the service level or rates offered, you agree that we will only be liable
      for damage, loss or delay resulting from our negligence or fault and that our liability is limited to the lesser of the following:<br/>
      (1) U.S. $0.60 per pound (where no Insurance value is declared) multiplied by the number of pounds that are actually damaged,
      lost or delayed, but not less than U.S. $50.00 per shipment; or<br/>
      (2) in the case of a declared insurance value stated herein, the declared value of the goods actually damaged, lost or delayed.
      See Terms and Conditions of Service for further Limitations on Liability.
    </div>
    <div>
      I hereby declare the contents of this consignment are fully and accurately described above, the proper shipping name and
      labeled/placarded, and are in all respects in proper condition for transport according to applicable international and
      national government regulations.
      <div class="sig">Signature</div>
    </div>
    <div>
      <div class="freight-title">Freight Charges</div>
      FREIGHT PREPAID except when box at right is checked &nbsp; <b>[ ]</b> &nbsp; Check box if charges are to be collect
      <div class="split">
        Subject to Section 17 of the conditions. If this shipment is to be delivered to the consignee, without recourse on the
        consignor, the consignor shall sign the following statement. The carrier shall not make delivery of this shipment without
        payment of freight and all other lawful charges.
        <div class="sig">(Signature of Consignor)</div>
      </div>
    </div>
    <div>
      <div class="bill-to">Bill To:<br/>Prepaid Term</div>
      <div class="logo">${SKY2C_LOGO_SVG}</div>
      <div class="addr">${lines(SKY2C_ADDRESS)}</div>
    </div>
  </div>
  <div class="received">
    RECEIVED, subject to the classifications and lawfully filed tariffs in effect on the date of the issue of this Bill of Lading,
    the property described above, in apparent good order, except as noted (contents and condition of contents of packages unknown),
    marked, consigned, and destined as indicated above, which said carrier (the word carrier being understood throughout this
    contract as meaning any person or corporation in possession of the property under the contract) agrees to carry to its usual
    place of delivery at said destination, if on its route, otherwise to deliver to another carrier on the route to the said
    destination. It is mutually agreed, as to each carrier of all or any of said property, that every service to be performed
    hereunder shall be subject to all the Bill of Lading terms and conditions in the governing classification on the date of shipment.
    Shipper hereby certifies that he is familiar with the bill of lading terms and conditions in the governing classification and
    the said terms and conditions are hereby agreed to by the shipper and accepted for himself and his assigns.
  </div>

  <div class="lines">
    <div class="line-row">
      <div class="pair">Driver Arrival Time:<span class="f"></span></div>
      <div class="pair">Driver Departure Time:<span class="f"></span></div>
    </div>
    <div class="line-row">
      <div class="pair" style="flex:3">Driver Signature:<span class="f"></span></div>
      <div class="pair">Date:<span class="f"></span></div>
    </div>
    <div class="line-row">
      <div class="pair" style="flex:3">Loader Signature:<span class="f"></span></div>
      <div class="pair">Date:<span class="f"></span></div>
    </div>
  </div>

  <div class="dhs">PURSUANT TO DEPARTMENT OF HOMELAND SECURITY<br/>REGULATIONS, SHIPPERS ARE ADVISED THAT SHIPMENTS ARE SUBJECT TO SEARCH</div>
</div>
</body>
</html>`;
}
