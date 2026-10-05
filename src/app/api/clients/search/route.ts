import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { searchClients, type ClientRole } from "@/lib/clientService";

const ROLE_VALUES: ClientRole[] = [
  "SHIPPER",
  "CONSIGNEE",
  "CARRIER",
  "NOTIFY",
  "SOLD_TO",
  "SHIP_TO",
  "ACCOUNT",
];

function isClientRole(value: string | null): value is ClientRole {
  return !!value && (ROLE_VALUES as string[]).includes(value);
}

/**
 * GET /api/clients/search?q=&role=&limit=
 * Thin type-ahead lookup used by <ClientLookupField>. Returns ClientSummary[]: { id, clientId, name }.
 */
export async function GET(request: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const roleParam = searchParams.get("role");
  const role = isClientRole(roleParam) ? roleParam : undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(100, Math.max(1, Number(limitParam) || 25)) : 25;

  const clients = await searchClients({ query: q, role, limit });

  return NextResponse.json(
    clients.map((c) => ({ id: c.id, clientId: c.clientId, name: c.name }))
  );
}
