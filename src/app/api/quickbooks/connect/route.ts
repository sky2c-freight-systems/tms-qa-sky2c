import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getAuthorizationUri } from "@/lib/qbo";

export async function GET() {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  return NextResponse.redirect(getAuthorizationUri(), { status: 302 });
}
