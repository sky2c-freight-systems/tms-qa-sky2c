"use client";

import { useState } from "react";
import AttachmentPreviewModal from "@/components/AttachmentPreviewModal";
import { EXTENSION_COLORS, extensionOf, formatFileSize } from "@/lib/fileDisplay";

/** Compact single-row alternative to AttachmentCard — same preview/download behavior, denser layout. */
export default function AttachmentListRow({
  name,
  size,
  viewHref,
  downloadHref,
}: {
  name: string;
  size?: number;
  viewHref: string;
  downloadHref: string;
}) {
  const [open, setOpen] = useState(false);
  const ext = extensionOf(name);
  const colorClass = EXTENSION_COLORS[ext] ?? "bg-slate-100 text-slate-600";

  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-2.5 text-sm">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded text-[9px] font-bold uppercase ${colorClass}`}
          >
            {ext || "•"}
          </button>
          <span className="truncate text-slate-800" title={name}>
            {name}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs">
          {size !== undefined && <span className="text-slate-500">{formatFileSize(size)}</span>}
          <button type="button" onClick={() => setOpen(true)} className="text-blue-600 hover:underline">
            View
          </button>
          <a href={downloadHref} className="text-blue-600 hover:underline">
            Download
          </a>
        </div>
      </div>

      {open && (
        <AttachmentPreviewModal name={name} viewHref={viewHref} downloadHref={downloadHref} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
