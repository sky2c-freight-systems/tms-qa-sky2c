import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

/** GET /api/shipments/[fileNumber]/bol/[id][?download=1] — one generated BOL as a PDF. */
export async function GET(request: Request, { params }: { params: Promise<{ fileNumber: string; id: string }> }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const { fileNumber, id } = await params;
  if (!/^[0-9a-f]{24}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const doc = await prisma.generatedDocument.findFirst({ where: { id, fileNumber }, select: { fileName: true, pdf: true } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const download = new URL(request.url).searchParams.get("download") === "1";
  return new NextResponse(new Uint8Array(doc.pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${doc.fileName}"`,
    },
  });
}
