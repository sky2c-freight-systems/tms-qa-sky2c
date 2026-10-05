import type { ShipmentDocumentData } from "@/lib/pdf/documentData";
import type { DocType } from "@/lib/pdf/documentTypes";
import { bookingConfirmation } from "@/lib/pdf/templates/bookingConfirmation";
import { containerLoadPlan } from "@/lib/pdf/templates/containerLoadPlan";
import { dockReceipt } from "@/lib/pdf/templates/dockReceipt";
import { masterBLInstruction } from "@/lib/pdf/templates/masterBLInstruction";
import { straightBillOfLading } from "@/lib/pdf/templates/straightBillOfLading";

export type DocumentTemplateRenderer = (data: ShipmentDocumentData) => string | Promise<string>;

/** One registry mapping each docType to its template renderer — the single dispatch point the API routes use. */
export const TEMPLATE_RENDERERS: Record<DocType, DocumentTemplateRenderer> = {
  bol: straightBillOfLading,
  "booking-confirmation": bookingConfirmation,
  "dock-receipt": dockReceipt,
  "master-bl": masterBLInstruction,
  "container-load-plan": containerLoadPlan,
};
