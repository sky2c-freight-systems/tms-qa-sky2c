import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/customerSession";
import { statusLabel } from "@/lib/tracking";

/**
 * GET /api/customer/shipments/[fileNumber] — read-only shipment detail for the logged-in
 * customer's own account. Same withholding rule as the public tracking page and the
 * customer shipments list: no pricing/insurance/billing fields (insuranceValueCents,
 * codFeeCents, dryRun, totalChargesCents all deliberately omitted below) — a customer
 * sees routing/schedule/cargo detail, never dollar amounts. Scoped strictly by
 * accountId === session.clientId; a fileNumber belonging to a different account 404s
 * exactly like a nonexistent one, so this can't be used to probe other accounts' file
 * numbers.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ fileNumber: string }> }) {
  let session;
  try {
    session = await requireCustomerSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!session.clientId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { fileNumber } = await params;
  const shipment = await prisma.domesticWarehouseShipment.findUnique({ where: { fileNumber } });
  if (!shipment || !shipment.isActive || shipment.accountId !== session.clientId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [shipper, consignee, carrier] = await Promise.all([
    shipment.shipperId ? prisma.client.findUnique({ where: { id: shipment.shipperId }, select: { name: true } }) : null,
    shipment.consigneeId
      ? prisma.client.findUnique({ where: { id: shipment.consigneeId }, select: { name: true } })
      : null,
    shipment.carrierId ? prisma.client.findUnique({ where: { id: shipment.carrierId }, select: { name: true } }) : null,
  ]);

  return NextResponse.json({
    data: {
      fileNumber: shipment.fileNumber,
      status: shipment.status,
      statusLabel: statusLabel(shipment.status),
      domesticType: shipment.domesticType,
      shipperName: shipper?.name ?? null,
      consigneeName: consignee?.name ?? null,
      carrierName: carrier?.name ?? null,
      placeOfReceipt: shipment.placeOfReceipt,
      origin: shipment.origin,
      destination: shipment.destination,
      placeOfDelivery: shipment.placeOfDelivery,
      country: shipment.country,
      incoTerms: shipment.incoTerms,
      proNumber: shipment.proNumber,
      bolNumber: shipment.bolNumber,
      typeOfService: shipment.typeOfService,
      otherReference: shipment.otherReference,
      paymentMethod: shipment.paymentMethod,
      transitStartAt: shipment.transitStartAt,
      transitEndAt: shipment.transitEndAt,
      shipAt: shipment.shipAt,
      cutoffAt: shipment.cutoffAt,
      etaAt: shipment.etaAt,
      atdAt: shipment.atdAt,
      cargoDescription: shipment.cargoDescription,
      serviceLevel: shipment.serviceLevel,
      createdAt: shipment.createdAt,
    },
  });
}
