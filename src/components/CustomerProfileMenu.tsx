"use client";

import { useRouter } from "next/navigation";

export interface CustomerProfile {
  clientName: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
}

/** Top-right profile pill for the customer portal — shows the account name, and reveals
 * full contact details + Log out on hover (pure CSS group-hover, no open/close state). */
export default function CustomerProfileMenu({ profile }: { profile: CustomerProfile }) {
  const router = useRouter();
  const displayName = profile.clientName ?? profile.email ?? "Account";
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  async function handleLogout() {
    await fetch("/api/customer/logout", { method: "POST" });
    router.push("/customer/login");
  }

  return (
    <div className="group relative">
      <button
        type="button"
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
          {initial}
        </span>
        <span className="max-w-[10rem] truncate">{displayName}</span>
      </button>

      {/* pt-2 (not a margin) so the gap above the panel is still inside the group's
          hoverable box — a margin-based gap would let the pointer "fall out" of the
          group while crossing it, closing the menu before it's reached. */}
      <div className="invisible absolute right-0 top-full z-20 w-64 pt-2 opacity-0 transition-opacity duration-100 group-hover:visible group-hover:opacity-100">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          <p className="text-sm font-semibold text-slate-900">{profile.clientName ?? "—"}</p>
          {profile.contactName && <p className="text-xs text-slate-500">{profile.contactName}</p>}
          <div className="mt-2 space-y-1 text-xs text-slate-600">
            {profile.email && (
              <p>
                <span className="text-slate-400">Email:</span> {profile.email}
              </p>
            )}
            {profile.phone && (
              <p>
                <span className="text-slate-400">Phone:</span> {profile.phone}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 w-full rounded border border-slate-300 py-1 text-xs text-slate-700 hover:bg-slate-50"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
