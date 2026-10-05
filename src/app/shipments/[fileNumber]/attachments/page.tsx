"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Spinner from "@/components/Spinner";
import AttachmentGallery from "@/components/AttachmentGallery";

interface Attachment {
  id: string;
  name: string;
  size?: number;
}

export default function ShipmentAttachmentsPage() {
  const params = useParams<{ fileNumber: string }>();
  const fileNumber = params.fileNumber;

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/shipments/${fileNumber}/attachments`);
        if (!res.ok) throw new Error("Failed to load attachments");
        const { data } = await res.json();
        if (!cancelled) setAttachments(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load attachments");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fileNumber]);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Attachments — {fileNumber}</h1>
        <Link href={`/shipments/${fileNumber}`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          &larr; Back to Shipment
        </Link>
      </div>

      <p className="mb-4 text-xs text-zinc-500">
        Pulled live from the Zoho Desk ticket that originated this shipment.
      </p>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-zinc-500">
          <Spinner className="h-4 w-4 text-brand" />
          Loading...
        </p>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-zinc-500">No attachments on the originating Zoho ticket.</p>
      ) : (
        <AttachmentGallery
          items={attachments.map((a) => {
            const base = `/api/shipments/${fileNumber}/attachments/${a.id}`;
            return { id: a.id, name: a.name, size: a.size, viewHref: `${base}?view=1`, downloadHref: base };
          })}
        />
      )}
    </div>
  );
}
