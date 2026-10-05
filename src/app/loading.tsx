import Spinner from "@/components/Spinner";

export default function Loading() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Spinner className="h-5 w-5 text-brand" />
        Loading…
      </div>
    </div>
  );
}
