import Spinner from "./Spinner";

interface LoadingOverlayProps {
  show: boolean;
  label?: string;
}

/**
 * Absolutely-positioned overlay for async content (tables, panels, etc). The
 * parent element must have `position: relative` for this to align correctly.
 */
export default function LoadingOverlay({ show, label = "Loading…" }: LoadingOverlayProps) {
  if (!show) return null;
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
      <div className="flex items-center gap-2 rounded-full border border-border-light bg-white px-3 py-1.5 text-sm text-muted shadow-sm">
        <Spinner className="h-4 w-4 text-brand" />
        {label}
      </div>
    </div>
  );
}
