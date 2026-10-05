import Link from "next/link";
import { notFound } from "next/navigation";
import type { ShipmentStatus, TrackingEventSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  TRACKING_MILESTONES,
  isFailedStatus,
  isTerminalStatus,
  statusBlurb,
  statusLabel,
} from "@/lib/tracking";
import { getTicketAttachments, isCustomerVisibleAttachment } from "@/lib/zohoDeskApi";
import AttachmentGallery from "@/components/AttachmentGallery";

/**
 * Same best-effort philosophy as the /api/tracking/[code] route this page mirrors — a
 * Zoho outage must never break the tracking page itself. Filtered to the
 * PICKUP_ZOHO/BOL_SIGNED_* naming convention (see isCustomerVisibleAttachment) — anyone
 * with the tracking code/link can reach this page, not just the customer, so everything
 * else on the ticket stays hidden here.
 */
async function getPublicAttachments(zohoTicketId: string | null | undefined) {
  if (!zohoTicketId) return [];
  try {
    const attachments = await getTicketAttachments(zohoTicketId);
    return attachments.filter((a) => isCustomerVisibleAttachment(a.name));
  } catch (err) {
    console.error(`[tracking] failed to load Zoho attachments for ticket ${zohoTicketId}:`, err);
    return [];
  }
}

/**
 * Customer-facing tracking page, reachable without a login (see src/middleware.ts).
 * Reads straight from Prisma rather than via /api/tracking — this is a server component,
 * so an internal fetch would just be an extra network hop; the API route exists for
 * external/programmatic callers.
 */

interface TrackingEventView {
  status: ShipmentStatus;
  note: string | null;
  location: string | null;
  occurredAt: Date;
  source: TrackingEventSource;
}

function formatDateTime(value: Date | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function formatWeekday(value: Date): string {
  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(value);
}

function formatLongDate(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

/** Milestones reached so far, for the progress rail. Exception statuses aren't milestones. */
function milestoneProgress(status: ShipmentStatus): { reached: number; total: number } {
  const idx = TRACKING_MILESTONES.indexOf(status);
  return { reached: idx < 0 ? 0 : idx + 1, total: TRACKING_MILESTONES.length };
}

export default async function TrackingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await params;
  const code = decodeURIComponent(rawCode).trim();

  let shipment = await prisma.domesticWarehouseShipment.findUnique({ where: { fileNumber: code } });
  if (!shipment) {
    const sync = await prisma.zohoSync.findFirst({
      where: { zohoTicketNumber: code, fileNumber: { not: null } },
      select: { fileNumber: true },
    });
    if (sync?.fileNumber) {
      shipment = await prisma.domesticWarehouseShipment.findUnique({ where: { fileNumber: sync.fileNumber } });
    }
  }
  if (!shipment || !shipment.isActive) notFound();

  const [events, sync, carrier] = await Promise.all([
    prisma.shipmentTrackingEvent.findMany({
      where: { shipmentId: shipment.id },
      orderBy: { occurredAt: "asc" },
      select: { status: true, note: true, location: true, occurredAt: true, source: true },
    }),
    prisma.zohoSync.findFirst({
      where: { fileNumber: shipment.fileNumber },
      select: { zohoTicketId: true, zohoTicketNumber: true, ticketSubject: true },
    }),
    shipment.carrierId
      ? prisma.client.findUnique({ where: { id: shipment.carrierId }, select: { name: true } })
      : Promise.resolve(null),
  ]);

  const attachments = await getPublicAttachments(sync?.zohoTicketId);

  const timeline: TrackingEventView[] = events;
  const latest = timeline.length ? timeline[timeline.length - 1] : null;
  const headlineDate = latest?.occurredAt ?? shipment.createdAt;
  const failed = isFailedStatus(shipment.status);
  const done = isTerminalStatus(shipment.status);
  const { reached, total } = milestoneProgress(shipment.status);

  const accent = failed ? "text-red-700" : done ? "text-green-700" : "text-blue-700";
  const railColor = failed ? "bg-red-600" : done ? "bg-green-600" : "bg-blue-600";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/tracking" className="text-sm text-blue-600 hover:underline">
          ← Track another shipment
        </Link>
        <span className="text-xs uppercase tracking-wide text-slate-400">Vhaul4u Tracking</span>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Left column — headline status, mirroring a carrier's "DELIVERED / Friday" block. */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {statusLabel(shipment.status)}
          </p>
          <h1 className="mt-1 text-4xl font-semibold text-slate-900">{formatWeekday(headlineDate)}</h1>
          <p className="mt-1 text-sm text-slate-500">{formatLongDate(headlineDate)}</p>
          <p className="mt-4 text-sm leading-relaxed text-slate-700">{statusBlurb(shipment.status)}</p>

          <dl className="mt-6 space-y-2 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">File Number</dt>
              <dd className="font-mono text-slate-800">{shipment.fileNumber}</dd>
            </div>
            {sync?.zohoTicketNumber && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Ticket</dt>
                <dd className="text-slate-800">#{sync.zohoTicketNumber}</dd>
              </div>
            )}
            {shipment.proNumber && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">PRO Number</dt>
                <dd className="font-mono text-slate-800">{shipment.proNumber}</dd>
              </div>
            )}
            {carrier?.name && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Carrier</dt>
                <dd className="text-slate-800">{carrier.name}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Middle column — current status and the route it's travelling. */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery Status</p>
          <p className={`mt-1 flex items-center gap-2 text-2xl font-semibold ${accent}`}>
            {statusLabel(shipment.status)}
            {done && !failed && (
              <span
                aria-hidden
                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-sm text-white"
              >
                ✓
              </span>
            )}
          </p>

          {!done && (
            <div className="mt-4">
              <div className="flex gap-1" role="img" aria-label={`Step ${reached} of ${total}`}>
                {TRACKING_MILESTONES.map((m, i) => (
                  <span
                    key={m}
                    className={`h-1.5 flex-1 rounded-full ${i < reached ? railColor : "bg-slate-200"}`}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Step {reached} of {total}
              </p>
            </div>
          )}

          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
            <p className="text-xs uppercase tracking-wide text-slate-400">From</p>
            <p className="mt-0.5 whitespace-pre-line text-slate-800">{shipment.origin ?? "—"}</p>
            <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">To</p>
            <p className="mt-0.5 whitespace-pre-line text-slate-800">{shipment.destination ?? "—"}</p>
          </div>

          {(shipment.shipAt || shipment.etaAt) && (
            <div className="mt-4 space-y-1 text-sm text-slate-600">
              {shipment.shipAt && <p>Pickup: {formatDateTime(shipment.shipAt)}</p>}
              {shipment.etaAt && <p>Estimated arrival: {formatDateTime(shipment.etaAt)}</p>}
            </div>
          )}
        </div>

        {/* Right column — the scan history rail. */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tracking History</p>

          {timeline.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No tracking events recorded yet.</p>
          ) : (
            <ol className="relative mt-4 space-y-6 pl-6">
              {/* The continuous rail behind the dots. */}
              <span aria-hidden className={`absolute left-[5px] top-1 h-[calc(100%-0.5rem)] w-0.5 ${railColor}`} />
              {timeline.map((e, i) => {
                const isLast = i === timeline.length - 1;
                return (
                  <li key={`${e.occurredAt.toISOString()}-${i}`} className="relative">
                    <span
                      aria-hidden
                      className={`absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-white ${
                        isLast ? railColor : "bg-slate-400"
                      }`}
                    />
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                      {statusLabel(e.status)}
                    </p>
                    {e.location && <p className="text-sm text-slate-800">{e.location}</p>}
                    <p className="text-sm text-slate-500">{formatDateTime(e.occurredAt)}</p>
                    {e.note && <p className="mt-1 text-xs italic text-slate-500">{e.note}</p>}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="mt-8 border-t border-slate-200 pt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Documents</p>
          <div className="mt-3">
            <AttachmentGallery
              items={attachments.map((a) => {
                const base = `/api/tracking/${encodeURIComponent(code)}/attachments/${encodeURIComponent(a.id)}`;
                return { id: a.id, name: a.name, size: a.size, viewHref: `${base}?view=1`, downloadHref: base };
              })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
