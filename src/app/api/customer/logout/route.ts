import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customerSession";

export async function POST() {
  const session = await getCustomerSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
