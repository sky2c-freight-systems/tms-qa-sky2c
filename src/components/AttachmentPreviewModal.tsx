"use client";

import { useState } from "react";
import Spinner from "@/components/Spinner";
import { IMAGE_EXTENSIONS, extensionOf } from "@/lib/fileDisplay";

/**
 * In-page popup that renders a file inline (PDF/image, via ?view=1 on the download
 * route) plus its own Download button. Shared by both the icon-card and list-row
 * attachment views so "View" behaves identically regardless of which layout is active.
 */
export default function AttachmentPreviewModal({
  name,
  viewHref,
  downloadHref,
  onClose,
}: {
  name: string;
  viewHref: string;
  downloadHref: string;
  onClose: () => void;
}) {
  const ext = extensionOf(name);
  const isPdf = ext === "pdf";
  const isImage = IMAGE_EXTENSIONS.has(ext);
  const [loading, setLoading] = useState(isPdf || isImage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-3">
          <p className="truncate text-sm font-medium text-slate-800" title={name}>
            {name}
          </p>
          <div className="flex shrink-0 items-center gap-3 pl-3 text-xs">
            <a href={downloadHref} className="text-blue-600 hover:underline">
              Download
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-lg leading-none text-slate-500 hover:text-slate-800"
            >
              &times;
            </button>
          </div>
        </div>
        <div className="relative flex-1 overflow-auto bg-slate-50 p-2">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50">
              <Spinner className="h-6 w-6 text-slate-400" />
              <p className="text-xs text-slate-500">Loading document...</p>
            </div>
          )}
          {isPdf ? (
            <iframe
              src={viewHref}
              title={name}
              className="h-[75vh] w-full rounded border-0"
              onLoad={() => setLoading(false)}
            />
          ) : isImage ? (
            <img
              src={viewHref}
              alt={name}
              className="mx-auto max-h-[75vh] max-w-full object-contain"
              onLoad={() => setLoading(false)}
              onError={() => setLoading(false)}
            />
          ) : (
            <p className="p-6 text-center text-sm text-slate-500">
              Preview isn&apos;t available for this file type — use Download above.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
