"use client";

import { useState } from "react";
import AttachmentCard from "@/components/AttachmentCard";
import AttachmentListRow from "@/components/AttachmentListRow";

export interface AttachmentGalleryItem {
  id: string;
  name: string;
  size?: number;
  viewHref: string;
  downloadHref: string;
}

const toggleButtonClass = (active: boolean) =>
  `rounded border px-2 py-1 text-xs leading-none ${
    active ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"
  }`;

/** Icon-grid (default) vs. compact-list toggle for a set of attachments — same items, same
 * View/Download behavior either way, just layout density. */
export default function AttachmentGallery({ items }: { items: AttachmentGalleryItem[] }) {
  const [view, setView] = useState<"icon" | "list">("icon");

  return (
    <div>
      <div className="mb-2 flex justify-end gap-1">
        <button
          type="button"
          onClick={() => setView("icon")}
          aria-label="Icon view"
          aria-pressed={view === "icon"}
          title="Icon view"
          className={toggleButtonClass(view === "icon")}
        >
          ▦ Icon
        </button>
        <button
          type="button"
          onClick={() => setView("list")}
          aria-label="List view"
          aria-pressed={view === "list"}
          title="List view"
          className={toggleButtonClass(view === "list")}
        >
          ☰ List
        </button>
      </div>

      {view === "icon" ? (
        <div className="flex flex-wrap gap-3">
          {items.map((item) => (
            <AttachmentCard key={item.id} name={item.name} size={item.size} viewHref={item.viewHref} downloadHref={item.downloadHref} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <AttachmentListRow
              key={item.id}
              name={item.name}
              size={item.size}
              viewHref={item.viewHref}
              downloadHref={item.downloadHref}
            />
          ))}
        </div>
      )}
    </div>
  );
}
