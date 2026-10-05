"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import CustomerProfileMenu, { type CustomerProfile } from "@/components/CustomerProfileMenu";
import {
  DOMESTIC_TYPE_LABELS,
  INCOTERMS_LABELS,
  TYPE_OF_SERVICE_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/enumLabels";

interface ShipmentDetail {
  fileNumber: string;
  status: string;
  statusLabel: string;
  domesticType: string;
  shipperName: string | null;
  consigneeName: string | null;
  carrierName: string | null;
  placeOfReceipt: string | null;
  origin: string | null;
  destination: string | null;
  placeOfDelivery: string | null;
  country: string | null;
  incoTerms: string | null;
  proNumber: string | null;
  bolNumber: string | null;
  typeOfService: string | null;
  otherReference: string | null;
  paymentMethod: string | null;
  transitStartAt: string | null;
  transitEndAt: string | null;
  shipAt: string | null;
  cutoffAt: string | null;
  etaAt: string | null;
  atdAt: string | null;
  cargoDescription: string | null;
  serviceLevel: string | null;
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="text-sm text-slate-800">{value || <span className="text-slate-400">—</span>}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-t border-slate-200 pt-4 first:border-t-0 first:pt-0">
      <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">{children}</div>
    </section>
  );
}

export default function CustomerShipmentDetailPage() {
  const params = useParams<{ fileNumber: string }>();
  const router = useRouter();
  const fileNumber = params.fileNumber;

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [meRes, detailRes] = await Promise.all([
          fetch("/api/customer/me"),
          fetch(`/api/customer/shipments/${fileNumber}`),
        ]);
        if (meRes.status === 401 || detailRes.status === 401) {
          router.push("/customer/login");
          return;
        }
        if (meRes.ok) {
          const meBody = await meRes.json();
          if (!cancelled) {
            setProfile({
              clientName: meBody.data?.clientName ?? null,
              contactName: meBody.data?.contactName ?? null,
              email: meBody.data?.email ?? null,
              phone: meBody.data?.phone ?? null,
            });
          }
        }
        if (detailRes.status === 404) {
          if (!cancelled) setError("Shipment not found.");
          return;
        }
        if (!detailRes.ok) throw new Error("Failed to load shipment");
        const body = await detailRes.json();
        if (!cancelled) setShipment(body.data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load shipment");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileNumber]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/customer/shipments" className="text-sm text-blue-600 hover:underline">
            &larr; Back to Shipments
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">Shipment {fileNumber}</h1>
        </div>
        {profile && <CustomerProfileMenu profile={profile} />}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : shipment ? (
        <div className="space-y-5 rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              {shipment.statusLabel}
            </span>
            <Link
              href={`/tracking/${shipment.fileNumber}`}
              target="_blank"
              className="text-sm text-blue-600 hover:underline"
              title="Open the tracking page"
            >
              Track shipment &rarr;
            </Link>
          </div>

          <Section title="Routing">
            <Field label="Place of Receipt" value={shipment.placeOfReceipt} />
            <Field label="Origin" value={shipment.origin} />
            <Field label="Destination" value={shipment.destination} />
            <Field label="Place of Delivery" value={shipment.placeOfDelivery} />
            <Field label="Country" value={shipment.country} />
          </Section>

          <Section title="Parties">
            <Field label="Shipper" value={shipment.shipperName} />
            <Field label="Consignee" value={shipment.consigneeName} />
            <Field label="Carrier" value={shipment.carrierName} />
          </Section>

          <Section title="Terms & References">
            <Field label="Domestic Type" value={DOMESTIC_TYPE_LABELS[shipment.domesticType] ?? shipment.domesticType} />
            <Field label="Inco Terms" value={shipment.incoTerms ? (INCOTERMS_LABELS[shipment.incoTerms] ?? shipment.incoTerms) : null} />
            <Field label="Pro Number" value={shipment.proNumber} />
            <Field label="BOL Number" value={shipment.bolNumber} />
            <Field
              label="Type of Service"
              value={shipment.typeOfService ? (TYPE_OF_SERVICE_LABELS[shipment.typeOfService] ?? shipment.typeOfService) : null}
            />
            <Field label="Other Reference" value={shipment.otherReference} />
            <Field
              label="Payment Method"
              value={shipment.paymentMethod ? (PAYMENT_METHOD_LABELS[shipment.paymentMethod] ?? shipment.paymentMethod) : null}
            />
          </Section>

          <Section title="Schedule">
            <Field label="Transit Start" value={formatDateTime(shipment.transitStartAt)} />
            <Field label="Transit End" value={formatDateTime(shipment.transitEndAt)} />
            <Field label="Ship At" value={formatDateTime(shipment.shipAt)} />
            <Field label="Cutoff At" value={formatDateTime(shipment.cutoffAt)} />
            <Field label="ETA" value={formatDateTime(shipment.etaAt)} />
            <Field label="ATD" value={formatDateTime(shipment.atdAt)} />
          </Section>

          <Section title="Cargo">
            <div className="col-span-full">
              <Field label="Cargo Description" value={shipment.cargoDescription} />
            </div>
            <Field label="Service Level" value={shipment.serviceLevel} />
          </Section>
        </div>
      ) : null}
    </div>
  );
}
