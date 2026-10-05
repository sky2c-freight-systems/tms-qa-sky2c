import { redirect } from "next/navigation";

/**
 * Tracking number entry form. Public, like the detail page it submits to.
 * Uses a server action rather than a client component so the page ships no JS —
 * it's a single input and a button.
 */
export default function TrackingSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ notfound?: string }>;
}) {
  async function track(formData: FormData) {
    "use server";
    const code = String(formData.get("code") ?? "").trim();
    if (!code) redirect("/tracking");
    redirect(`/tracking/${encodeURIComponent(code)}`);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-3xl font-semibold text-slate-900">Track your shipment</h1>
      <p className="mt-2 text-sm text-slate-600">
        Enter your file number or the ticket number from your confirmation email.
      </p>

      <form action={track} className="mt-6 flex gap-2">
        <input
          name="code"
          required
          autoFocus
          placeholder="e.g. 996510000 or 284"
          aria-label="File number or ticket number"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Track
        </button>
      </form>

      <TrackingNotFoundHint searchParams={searchParams} />
    </div>
  );
}

async function TrackingNotFoundHint({
  searchParams,
}: {
  searchParams: Promise<{ notfound?: string }>;
}) {
  const { notfound } = await searchParams;
  if (!notfound) return null;
  return (
    <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
      We couldn&apos;t find a shipment for “{notfound}”. Double-check the number and try again.
    </p>
  );
}
