import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { listActiveQboItems } from "@/lib/qbo";

/** Lists active QBO Products/Services, for the /quickbooks/charge-codes item picker. */
export async function GET() {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const items = await listActiveQboItems();
    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load QuickBooks items" },
      { status: 400 }
    );
  }
}
