import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CargoEditor from "./CargoEditor";

interface PageProps {
  params: Promise<{ fileNumber: string }>;
}

export default async function ShipmentCargoPage({ params }: PageProps) {
  const { fileNumber } = await params;

  const shipment = await prisma.domesticWarehouseShipment.findUnique({ where: { fileNumber } });
  if (!shipment) notFound();

  const containers = await prisma.cargoContainer.findMany({
    where: { shipmentId: shipment.id },
    include: { items: { orderBy: { id: "asc" } } },
    orderBy: { id: "asc" },
  });

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Cargo — File #{fileNumber}</h1>
          <p className="text-sm text-zinc-500">Containers and line items for this shipment</p>
        </div>
        <Link
          href={`/shipments/${fileNumber}`}
          className="text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          ← Back to Shipment
        </Link>
      </div>

      <CargoEditor fileNumber={fileNumber} initialContainers={containers} />
    </div>
  );
}
