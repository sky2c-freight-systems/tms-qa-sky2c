import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SyncPanel } from "./SyncPanel";

export const dynamic = "force-dynamic";

export default async function QuickBooksPage({
  searchParams,
}: {
  searchParams: Promise<{ qbo?: string; message?: string; realmId?: string }>;
}) {
  const params = await searchParams;
  const [connection, pendingCount] = await Promise.all([
    prisma.qboConnection.findFirst({ orderBy: { updatedAt: "desc" } }),
    prisma.arInvoice.count({ where: { status: "POSTED", qboInvoiceId: { isSet: false } } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-1 text-xl font-semibold text-gray-900">QuickBooks Online</h1>
      <p className="mb-6 text-sm text-gray-500">
        Connection status and AR invoice sync.
      </p>

      {params.qbo === "connected" ? (
        <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Connected to QuickBooks (realm {params.realmId}).
        </p>
      ) : null}
      {params.qbo === "error" ? (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Connection failed: {params.message ?? "Unknown error"}
        </p>
      ) : null}

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {connection ? (
          <dl className="space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="font-medium text-gray-700">Status:</dt>
              <dd className="text-gray-900">Connected</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-gray-700">Realm ID:</dt>
              <dd className="text-gray-900">{connection.realmId}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-gray-700">Environment:</dt>
              <dd className="text-gray-900">{connection.environment}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-gray-700">Access token expires:</dt>
              <dd className="text-gray-900">
                {connection.accessTokenExpiresAt.toLocaleString()}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-gray-700">Refresh token expires:</dt>
              <dd className="text-gray-900">
                {connection.refreshTokenExpiresAt.toLocaleString()}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-gray-900">Not connected.</p>
        )}
      </div>

      {connection ? (
        <>
          <p className="mb-4 text-sm text-gray-600">
            {pendingCount === 0
              ? "No invoices pending sync."
              : `${pendingCount} invoice(s) pending sync — a background job retries these every 5 minutes; use "Sync Now" to push immediately.`}
          </p>
          <SyncPanel />
          <a
            href="/api/quickbooks/connect"
            className="mt-4 inline-block text-sm text-blue-600 hover:underline"
          >
            Reconnect to QuickBooks (e.g. if sync starts failing with an invalid/expired token)
          </a>
        </>
      ) : (
        <a
          href="/api/quickbooks/connect"
          className="inline-block rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Connect to QuickBooks
        </a>
      )}

      <div className="mt-8 border-t border-gray-200 pt-4">
        <Link
          href="/quickbooks/charge-codes"
          className="text-sm text-blue-600 hover:underline"
        >
          Set default invoice Product/Service
        </Link>
      </div>
    </div>
  );
}
