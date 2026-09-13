import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";

import { getTeamActor } from "@/lib/team/dal";
import { memberLabel } from "@/lib/team/format";

export const metadata = {
  robots: { index: false, follow: false },
};

/**
 * Nothing signed-in is ever prerendered.
 *
 * Next statically renders a route unless something forces it dynamic, and
 * a Supabase read through the service-role client is not something it
 * counts — a dashboard baked at build time would show one member's
 * ledger to whoever loaded it next. Declared here rather than page by page
 * because the rule is the section's, not any one page's.
 */
export const dynamic = "force-dynamic";

export default async function TeamLayout({
  children,
}: {
  children: ReactNode;
}) {
  const member = await getTeamActor();
  // A cookie that verifies but resolves to nobody — suspended, reset,
  // deleted — has to be cleared, and only a route handler may do that.
  if (!member) redirect("/team/signed-out");

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-[radial-gradient(1100px_560px_at_15%_-10%,rgba(45,212,191,0.10),transparent_55%),#0b1120]">
      <header className="border-b border-white/10 bg-white/[0.02] backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3 px-5 py-4">
          <Link className="flex items-center gap-2.5" href="/team/dashboard">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 ring-1 ring-accent/30">
              <span className="text-sm font-black tracking-tight text-accent">
                sH
              </span>
            </span>
            <span className="text-sm font-bold tracking-tight">
              syd<span className="text-accent">Hustle</span> Team
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {memberLabel(member)}
            </span>
            <form action="/team/logout" method="post">
              <button
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                type="submit"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.75} />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-8">{children}</main>
    </div>
  );
}
