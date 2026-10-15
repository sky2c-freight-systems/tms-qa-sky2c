import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/session";
import { getAutoPickupBolEnabled, setAutoPickupBolEnabled } from "@/lib/pickupBol";

/** GET/PUT /api/settings/auto-pickup-bol — the app-wide "Auto-generate BOL" toggle. */
export async function GET() {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  return NextResponse.json({ data: { enabled: await getAutoPickupBolEnabled() } });
}

const bodySchema = z.object({ enabled: z.boolean() });

export async function PUT(request: Request) {
  let userId: string | undefined;
  try {
    userId = (await requireSession()).userId;
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Expected { enabled: boolean }" }, { status: 400 });
  await setAutoPickupBolEnabled(parsed.data.enabled, userId);
  return NextResponse.json({ data: { enabled: parsed.data.enabled } });
}
