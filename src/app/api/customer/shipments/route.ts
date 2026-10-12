import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/customerSession";
import { statusLabel } from "@/lib/tracking";

/**
 * GET /api/customer/shipments — every shipment for the logged-in customer's linked
 * Account (Client), scoped strictly by session.clientId. This is the one place a
 * customer-portal session is allowed to see beyond a single tracking code — still no
 * pricing/invoice data, matching the same withholding rule as the public tracking page.
 */
export async function GET() {
  let session;
  try {
    session = await requireCustomerSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!session.clientId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const shipments = await prisma.domesticWarehouseShipment.findMany({
    // Child shipments are internal department work under the customer's order — only the
    // top-level shipment is the customer's.
    where: {
      accountId: session.clientId,
      isActive: true,
      OR: [{ parentId: null }, { parentId: { isSet: false } }],
    },
    orderBy: { createdAt: "desc" },
    select: {
      fileNumber: true,
      status: true,
      origin: true,
      destination: true,
      shipAt: true,
      etaAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    data: shipments.map((s) => ({
      fileNumber: s.fileNumber,
      status: s.status,
      statusLabel: statusLabel(s.status),
      origin: s.origin,
      destination: s.destination,
      shipAt: s.shipAt,
      etaAt: s.etaAt,
      createdAt: s.createdAt,
    })),
  });
}
