import { getShipmentDocumentData, type ShipmentDocumentData } from "@/lib/pdf/documentData";
import { renderHtmlToPdf } from "@/lib/pdf/renderToPdf";
import { TEMPLATE_RENDERERS } from "@/lib/pdf/templates";
import type { DocType } from "@/lib/pdf/documentTypes";

/**
 * Thin orchestration layer used by both the preview/PDF GET route and the
 * email POST route, so "load data -> pick template -> render" only happens
 * in one place.
 */
export async function renderDocumentHtml(
  fileNumber: string,
  docType: DocType
): Promise<{ html: string; data: ShipmentDocumentData }> {
  const data = await getShipmentDocumentData(fileNumber);
  const renderer = TEMPLATE_RENDERERS[docType];
  const html = await renderer(data);
  return { html, data };
}

export async function renderDocumentPdf(
  fileNumber: string,
  docType: DocType
): Promise<{ pdf: Buffer; data: ShipmentDocumentData }> {
  const { html, data } = await renderDocumentHtml(fileNumber, docType);
  const pdf = await renderHtmlToPdf(html);
  return { pdf, data };
}
