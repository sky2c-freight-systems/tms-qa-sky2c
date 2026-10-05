/** Shared by AttachmentCard/AttachmentListRow/AttachmentPreviewModal — pure display helpers, no React. */
export const EXTENSION_COLORS: Record<string, string> = {
  pdf: "bg-red-100 text-red-700",
  doc: "bg-blue-100 text-blue-700",
  docx: "bg-blue-100 text-blue-700",
  xls: "bg-green-100 text-green-700",
  xlsx: "bg-green-100 text-green-700",
  csv: "bg-green-100 text-green-700",
  jpg: "bg-purple-100 text-purple-700",
  jpeg: "bg-purple-100 text-purple-700",
  png: "bg-purple-100 text-purple-700",
  gif: "bg-purple-100 text-purple-700",
  webp: "bg-purple-100 text-purple-700",
};

export const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp"]);

export function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot + 1).toLowerCase();
}

export function formatFileSize(bytes?: number): string {
  if (bytes === undefined) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
