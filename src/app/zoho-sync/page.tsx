import { prisma } from "@/lib/prisma";
import { buildZohoTicketUrl } from "@/lib/zohoTicketUrl";

// Without this, Next tries to statically prerender this page at `next build` time
// (no cookies()/searchParams usage to opt it out automatically) - during the Docker
// build DATABASE_URL is a placeholder that can't actually connect, so the build sat
// for ~24 minutes retrying MongoDB replica-set discovery before giving up. This is
// also just correct on its own: it's a live audit trail, never meant to be cached.
export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "SYNCED"
      ? "bg-green-100 text-green-800"
      : status === "FAILED"
        ? "bg-red-100 text-red-800"
        : "bg-amber-100 text-amber-800";
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${color}`}>{status}</span>;
}

export default async function ZohoSyncPage() {
  const rows = await prisma.zohoSync.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Zoho Sync</h1>
        <p className="mt-1 text-sm text-slate-500">
          Audit trail of Zoho Desk tickets synced into Domestic Warehouse shipments (most recent 100).
        </p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Ticket</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Subject</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Client</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Origin → Destination</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">File Number</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Status</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Error</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const zohoUrl = buildZohoTicketUrl(row.zohoTicketId);
              return (
              <tr key={row.id}>
                <td className="px-3 py-2 text-slate-700">
                  {zohoUrl ? (
                    <a
                      href={zohoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                      title="Open this ticket in Zoho Desk"
                    >
                      {row.zohoTicketNumber ?? row.zohoTicketId}
                    </a>
                  ) : (
                    (row.zohoTicketNumber ?? row.zohoTicketId)
                  )}
                </td>
                <td className="px-3 py-2 text-slate-700">{row.ticketSubject ?? "—"}</td>
                <td className="px-3 py-2 text-slate-700">{row.clientName ?? "—"}</td>
                <td className="px-3 py-2 text-slate-700">
                  {row.origin ?? "—"} → {row.destination ?? "—"}
                </td>
                <td className="px-3 py-2 font-mono text-slate-700">{row.fileNumber ?? "—"}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={row.syncStatus} />
                </td>
                <td className="max-w-xs truncate px-3 py-2 text-red-700" title={row.errorMessage ?? undefined}>
                  {row.errorMessage ?? ""}
                </td>
                <td className="px-3 py-2 text-slate-500">{row.updatedAt.toISOString()}</td>
              </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-slate-400">
                  No Zoho sync activity yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
