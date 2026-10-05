import PrintOptionsClient from "./PrintOptionsClient";

interface PageProps {
  params: Promise<{ fileNumber: string }>;
}

export default async function ShipmentPrintPage({ params }: PageProps) {
  const { fileNumber } = await params;
  return <PrintOptionsClient fileNumber={fileNumber} />;
}
