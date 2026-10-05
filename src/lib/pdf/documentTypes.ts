/**
 * Document-type metadata shared between server routes and the client "Print
 * Options" page. Deliberately has no server-only imports (no prisma, no
 * puppeteer) so it's safe to import from a client component.
 */
export interface DocumentTypeMeta {
  docType: string;
  label: string;
}

export const DOCUMENT_TYPES = [
  { docType: "bol", label: "Straight Bill of Lading" },
  { docType: "booking-confirmation", label: "Booking Confirmation" },
  { docType: "dock-receipt", label: "Dock Receipt" },
  { docType: "master-bl", label: "Master B/L Instruction" },
  { docType: "container-load-plan", label: "Container Load Plan" },
] as const satisfies readonly DocumentTypeMeta[];

export type DocType = (typeof DOCUMENT_TYPES)[number]["docType"];

export function isDocType(value: string): value is DocType {
  return DOCUMENT_TYPES.some((d) => d.docType === value);
}

export function docTypeLabel(docType: DocType): string {
  return DOCUMENT_TYPES.find((d) => d.docType === docType)?.label ?? docType;
}
