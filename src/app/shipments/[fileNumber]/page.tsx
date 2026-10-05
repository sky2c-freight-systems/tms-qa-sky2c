"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ShipmentForm, { EMPTY_SHIPMENT_FORM_VALUES, shipmentToFormValues, type ShipmentFormValues } from "@/components/ShipmentForm";
import Spinner from "@/components/Spinner";

export default function ShipmentEditPage() {
  const params = useParams<{ fileNumber: string }>();
  const fileNumber = params.fileNumber;

  const [values, setValues] = useState<ShipmentFormValues>({ ...EMPTY_SHIPMENT_FORM_VALUES });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/shipments/${fileNumber}`);
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error("Failed to load shipment");
        const { data } = await res.json();
        if (!cancelled) setValues(shipmentToFormValues(data));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load shipment");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fileNumber]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Link href="/shipments" className="mb-4 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">
          &larr; Back to Shipments
        </Link>
        <p className="text-sm text-zinc-500">Shipment {fileNumber} not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <Link href="/shipments" className="mb-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">
        &larr; Back to Shipments
      </Link>
      <h1 className="mb-4 text-xl font-semibold">Shipment {fileNumber}</h1>
      {loading ? (
        <p className="flex items-center gap-2 text-sm text-zinc-500">
          <Spinner className="h-4 w-4 text-brand" />
          Loading...
        </p>
      ) : (
        <>
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <ShipmentForm mode="edit" fileNumber={fileNumber} initialValues={values} />
        </>
      )}
    </div>
  );
}
