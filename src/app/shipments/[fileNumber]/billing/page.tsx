import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BillingClient from "./BillingClient";

interface PageProps {
  params: Promise<{ fileNumber: string }>;
}

/**
 * AR billing sub-page for a shipment: /shipments/[fileNumber]/billing. Loads the
 * shipment (404 if missing) and its ArInvoice rows server-side for first paint, then
 * hands off to the client component for all create/edit/post/cancel/delete/reverse/
 * adjust interactions.
 */
export default async function ShipmentBillingPage({ params }: PageProps) {
  const { fileNumber } = await params;

  const shipment = await prisma.domesticWarehouseShipment.findUnique({
    where: { fileNumber },
  });
  if (!shipment) {
    notFound();
  }

  const invoices = await prisma.arInvoice.findMany({
    where: { fileNumber },
    orderBy: { createdAt: "desc" },
  });

  return (
    <BillingClient
      fileNumber={fileNumber}
      shipmentId={shipment.id}
      defaultAccountId={shipment.accountId}
      initialBillableStatus={shipment.billableStatus}
      initialInvoices={invoices}
    />
  );
}
