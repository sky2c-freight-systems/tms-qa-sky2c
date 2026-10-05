import type { CargoContainer, CargoItem, Client, DomesticWarehouseShipment } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Loads everything the five print templates need for one shipment, in one
 * place, so every template agrees on a single data shape instead of each
 * re-deriving its own view of the shipment (which is how the legacy app's
 * five documents drifted out of sync with each other).
 */

export type CargoContainerWithItems = CargoContainer & { items: CargoItem[] };

export interface ShipmentDocumentData {
  shipment: DomesticWarehouseShipment;
  /** Client rows resolved from the shipment's plain ObjectId scalar fields. */
  account: Client | null;
  shipper: Client | null;
  consignee: Client | null;
  carrier: Client | null;
  notifyParty: Client | null;
  soldTo: Client | null;
  shipTo: Client | null;
  cargoContainers: CargoContainerWithItems[];
}

export class ShipmentNotFoundError extends Error {
  constructor(fileNumber: string) {
    super(`Shipment not found: ${fileNumber}`);
    this.name = "ShipmentNotFoundError";
  }
}

async function findClient(id: string | null): Promise<Client | null> {
  if (!id) return null;
  return prisma.client.findUnique({ where: { id } });
}

export async function getShipmentDocumentData(fileNumber: string): Promise<ShipmentDocumentData> {
  const shipment = await prisma.domesticWarehouseShipment.findUnique({ where: { fileNumber } });
  if (!shipment) throw new ShipmentNotFoundError(fileNumber);

  const [account, shipper, consignee, carrier, notifyParty, soldTo, shipTo, cargoContainers] =
    await Promise.all([
      findClient(shipment.accountId),
      findClient(shipment.shipperId),
      findClient(shipment.consigneeId),
      findClient(shipment.carrierId),
      findClient(shipment.notifyPartyId),
      findClient(shipment.soldToId),
      findClient(shipment.shipToId),
      prisma.cargoContainer.findMany({
        where: { shipmentId: shipment.id },
        include: { items: true },
      }),
    ]);

  return {
    shipment,
    account,
    shipper,
    consignee,
    carrier,
    notifyParty,
    soldTo,
    shipTo,
    cargoContainers,
  };
}
