import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

/** Read-only list of ZohoSync rows, most recent first, for manually verifying webhook sync results. Real session auth (401 on failure) — unlike the webhook POST routes, this is an interactive-UI endpoint. */
export async function GET(request: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedLimit = Number(searchParams.get("limit"));
  const limit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 100;

  const rows = await prisma.zohoSync.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ data: rows });
}
