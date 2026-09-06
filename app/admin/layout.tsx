import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { AdminNav } from "@/components/admin/AdminNav";
import { hasAdminSession } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

/**
 * /admin is the room where access itself is decided, so it looks nothing
 * like the console — different chrome, its own sign-in, no sidebar full of
 * operational tabs. Being unable to mistake one for the other is the point.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const signedIn = await hasAdminSession();

  return (
    <div className="min-h-dvh bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(45,212,191,0.06),transparent_55%),#0b1120]">
      <header className="border-b border-white/10 bg-[#070d1a]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/15 ring-1 ring-amber-400/30">
              <ShieldCheck className="h-4 w-4 text-amber-300" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight">
                sydHustle <span className="text-amber-300">Admin</span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                Access control · superadmin only
              </p>
            </div>
          </Link>

          {signedIn && <AdminNav />}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
