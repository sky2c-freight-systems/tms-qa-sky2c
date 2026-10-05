"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ShipmentForm, {
  EMPTY_SHIPMENT_FORM_VALUES,
  shipmentToFormValues,
  type ShipmentFormValues,
} from "@/components/ShipmentForm";
import { DOMESTIC_TYPE_LABELS } from "@/lib/enumLabels";

function NewShipmentFormInner() {
  const searchParams = useSearchParams();
  const domesticType = searchParams.get("domesticType") ?? "";
  const copyFrom = searchParams.get("copyFrom") ?? "";

  const [initialValues, setInitialValues] = useState<ShipmentFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!domesticType || !(domesticType in DOMESTIC_TYPE_LABELS)) {
      // Surfacing a validation error for a missing/invalid query param is the state this
      // effect synchronizes — there's no external system to subscribe to here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("Missing or invalid shipment type — start again from the New Shipment page.");
      return;
    }
    if (!copyFrom) {
      setInitialValues({ ...EMPTY_SHIPMENT_FORM_VALUES, domesticType });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/shipments/${copyFrom}`);
        if (!res.ok) throw new Error(`Could not load shipment ${copyFrom} to copy from`);
        const { data } = await res.json();
        if (cancelled) return;
        const copied = shipmentToFormValues(data);
        // fileNumber, status, and the schedule dates always reset for a new shipment —
        // only parties/routing/terms/cargo carry over from the copy source.
        setInitialValues({
          ...copied,
          domesticType,
          status: "SCHEDULED",
          transitStartAt: "",
          transitEndAt: "",
          shipAt: "",
          cutoffAt: "",
          etaAt: "",
          atdAt: "",
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load shipment to copy from");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [domesticType, copyFrom]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!initialValues) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-xl font-semibold">New Shipment — {DOMESTIC_TYPE_LABELS[domesticType]}</h1>
      <ShipmentForm mode="create" lockDomesticType initialValues={initialValues} />
    </div>
  );
}

export default function NewShipmentFormPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl p-6 text-sm text-zinc-500">Loading...</div>}>
      <NewShipmentFormInner />
    </Suspense>
  );
}
