import type { ShipmentDocumentData } from "@/lib/pdf/documentData";
import { BASE_PRINT_STYLES, COMPANY_LETTERHEAD, escapeHtml, fmtNum } from "@/lib/pdf/templates/shared";

/** Container Load Plan — full cargo/container listing with running totals of pieces, weight, and cube. */
export function containerLoadPlan(data: ShipmentDocumentData): string {
  const { shipment } = data;

  let totalPieces = 0;
  let totalWeightLbs = 0;
  let totalCft = 0;

  const rows: string[] = [];
  for (const container of data.cargoContainers) {
    if (container.items.length === 0) {
      rows.push(`
        <tr>
          <td>${escapeHtml(container.containerNumber) || "&mdash;"}</td>
          <td>${escapeHtml(container.containerType) || ""}</td>
          <td>&mdash;</td>
          <td class="num"></td>
          <td class="num"></td>
          <td class="num"></td>
        </tr>
      `);
      continue;
    }
    for (const item of container.items) {
      totalPieces += item.numberOfPieces ?? 0;
      totalWeightLbs += item.grossWeightLbs ?? 0;
      totalCft += item.grossSizeCft ?? 0;

      rows.push(`
        <tr>
          <td>${escapeHtml(container.containerNumber) || "&mdash;"}</td>
          <td>${escapeHtml(container.containerType) || ""}</td>
          <td>${escapeHtml(item.description) || ""}</td>
          <td class="num">${item.numberOfPieces ?? ""}</td>
          <td class="num">${item.grossWeightLbs ? fmtNum(item.grossWeightLbs) : ""}</td>
          <td class="num">${item.grossSizeCft ? fmtNum(item.grossSizeCft, 2) : ""}</td>
        </tr>
      `);
    }
  }
  if (rows.length === 0) {
    rows.push(`<tr><td colspan="6" class="no-cargo">No containers on file.</td></tr>`);
  }

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(shipment.fileNumber)} - Container Load Plan</title>
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
    <h1>CONTAINER LOAD PLAN</h1>
    <div><span class="field-label">File #:</span> ${escapeHtml(shipment.fileNumber)}</div>
  </div>

  <table class="cargo-table">
    <thead>
      <tr>
        <th>Container #</th>
        <th>Type</th>
        <th>Description</th>
        <th class="num">Pieces</th>
        <th class="num">Weight (lbs)</th>
        <th class="num">Cube (cft)</th>
      </tr>
    </thead>
    <tbody>
      ${rows.join("\n")}
    </tbody>
    <tfoot>
      <tr class="totals-row">
        <td colspan="3">Totals</td>
        <td class="num">${fmtNum(totalPieces)}</td>
        <td class="num">${fmtNum(totalWeightLbs)}</td>
        <td class="num">${fmtNum(totalCft, 2)}</td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`;
}
