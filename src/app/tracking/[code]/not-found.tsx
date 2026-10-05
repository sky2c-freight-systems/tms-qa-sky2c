import Link from "next/link";

/** Shown when a tracking code matches no active shipment. Deliberately gives no hint as to whether the number exists but is hidden. */
export default function TrackingNotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Shipment not found</h1>
      <p className="mt-2 text-sm text-slate-600">
        We couldn&apos;t find a shipment for that number. Check the file or ticket number on your
        confirmation and try again.
      </p>
      <Link
        href="/tracking"
        className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Track another shipment
      </Link>
    </div>
  );
}
