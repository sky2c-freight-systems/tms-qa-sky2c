import type { ShipmentDocumentData } from "@/lib/pdf/documentData";
import { BASE_PRINT_STYLES, COMPANY_LETTERHEAD, clientAddressHtml, escapeHtml, fmtNum } from "@/lib/pdf/templates/shared";

/**
 * Master B/L Instruction.
 *
 * Role mapping (schema has no distinct "forwarding agent" role, per spec):
 * shipper -> Exporter, consignee -> Consignee, notifyParty -> Notify Party,
 * account (the AR/customer client) -> Forwarding Agent stand-in.
 */
export function masterBLInstruction(data: ShipmentDocumentData): string {
  const { shipment, shipper, consignee, notifyParty, account } = data;

  const rows: string[] = [];
  for (const container of data.cargoContainers) {
    for (const item of container.items) {
      rows.push(`
        <tr>
          <td>${escapeHtml(container.containerNumber) || "&mdash;"}</td>
          <td class="num">${item.numberOfPieces ?? ""} ${escapeHtml(item.pieceType ?? "")}</td>
          <td>${escapeHtml(item.description) || ""}</td>
          <td class="num">${item.grossWeightLbs ? `${fmtNum(item.grossWeightLbs)} lbs` : ""}</td>
          <td class="num">${item.grossSizeCft ? `${fmtNum(item.grossSizeCft, 2)} cft` : ""}</td>
        </tr>
      `);
    }
  }
  if (rows.length === 0) {
    rows.push(`<tr><td colspan="5" class="no-cargo">No cargo items on file.</td></tr>`);
  }

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(shipment.fileNumber)} - Master B/L Instruction</title>
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
    <h1>MASTER B/L INSTRUCTION</h1>
    <div><span class="field-label">File #:</span> ${escapeHtml(shipment.fileNumber)}</div>
  </div>

  <div class="two-col">
    <div class="party-block">
      <div class="party-title">Exporter</div>
      ${clientAddressHtml(shipper)}
    </div>
    <div class="party-block">
      <div class="party-title">Consignee</div>
      ${clientAddressHtml(consignee)}
    </div>
  </div>
  <div class="two-col">
    <div class="party-block">
      <div class="party-title">Notify Party</div>
      ${clientAddressHtml(notifyParty)}
    </div>
    <div class="party-block">
      <div class="party-title">Forwarding Agent</div>
      ${clientAddressHtml(account)}
    </div>
  </div>

  <table class="cargo-table">
    <thead>
      <tr>
        <th>Marks (Container)</th>
        <th class="num">Pieces</th>
        <th>Description</th>
        <th class="num">Weight</th>
        <th class="num">Measurement</th>
      </tr>
    </thead>
    <tbody>
      ${rows.join("\n")}
    </tbody>
  </table>
</body>
</html>`;
}
