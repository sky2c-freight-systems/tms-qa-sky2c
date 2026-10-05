import Link from "next/link";
import { getSession } from "@/lib/session";
import LogoutButton from "@/components/LogoutButton";
import NavLinks from "@/components/NavLinks";

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const initials = parts.map((p) => p[0]!.toUpperCase()).join("");
  return initials || "?";
}

export default async function NavBar() {
  const session = await getSession();
  if (!session.userId) return null;

  const displayName = session.displayName ?? session.email ?? "";

  return (
    <header className="sticky top-0 z-30 border-b border-navy-dark bg-navy shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight text-white">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-brand" aria-hidden="true" />
            Vhaul4u <span className="font-normal text-white/60">TMS</span>
          </Link>
          <NavLinks />
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white"
              aria-hidden="true"
            >
              {initialsFor(displayName)}
            </span>
            <span className="hidden max-w-[10rem] truncate text-sm text-white/70 sm:inline">{displayName}</span>
          </div>
          <LogoutButton className="rounded-md px-3 py-1.5 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-60" />
        </div>
      </div>
    </header>
  );
}
