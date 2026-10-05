import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { syncAllPendingInvoices } from "@/lib/qbo";

/** Manual "Sync Now" — same logic as the periodic background retry, run on demand. */
export async function POST() {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const results = await syncAllPendingInvoices();
  return NextResponse.json({ results });
}
