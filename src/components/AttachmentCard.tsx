"use client";

import { useState } from "react";
import AttachmentPreviewModal from "@/components/AttachmentPreviewModal";
import { EXTENSION_COLORS, extensionOf, formatFileSize } from "@/lib/fileDisplay";

/**
 * Small file-preview card: a colored icon badge (by extension) instead of a real
 * thumbnail — Zoho's own preview image (previewurl) needs a Zoho session, not our API
 * token, so it 401s outside their console and isn't usable here. Clicking the icon or
 * "View" opens AttachmentPreviewModal; "Download" here skips the popup.
 */
export default function AttachmentCard({
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
      <div className="flex w-40 flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-center shadow-sm">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`flex h-9 w-9 items-center justify-center rounded-md text-[10px] font-bold uppercase ${colorClass}`}
        >
          {ext || "FILE"}
        </button>
        <p className="line-clamp-2 w-full break-words text-xs text-slate-800" title={name}>
          {name}
        </p>
        {size !== undefined && <p className="text-[11px] text-slate-500">{formatFileSize(size)}</p>}
        <div className="flex gap-2 text-xs">
          <button type="button" onClick={() => setOpen(true)} className="text-blue-600 hover:underline">
            View
          </button>
          <span className="text-slate-300">|</span>
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
