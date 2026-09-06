import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";

import { ConsoleLoginForm } from "@/components/console/ConsoleLoginForm";
import { firstAllowedPath, getConsoleActor } from "@/lib/console/dal";
import { SITE_NAME } from "@/lib/site";

export const metadata = {
  title: "Console — sydHustle",
  robots: { index: false, follow: false },
};

function errorMessage(code: string | undefined): string | null {
  switch (code) {
    case "invalid":
      return "That email and password don't match.";
    case "config":
      return "Console sign-in is not configured on this deployment.";
    case "expired":
      return "Your session ended. Sign in again to carry on.";
    default:
      return null;
  }
}

/**
 * The console's front door — the one page in here anybody sees before they
 * are anybody, and the page they land back on every time they log out.
 *
 * It wears the console's own chrome rather than the site's: the same dark
 * navy and teal glow as the panel behind it, the same `sH` mark as the
 * sidebar. Someone arriving at a bare card on a black page has no way to
 * tell a working deploy from a broken one, and this is the address they
 * type from memory.
 */
export default async function ConsoleLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; signed_out?: string }>;
}) {
  const actor = await getConsoleActor();
  if (actor) {
    // Somewhere they can actually open — sending a member of staff to
    // /console/overview would bounce them off a tab they may not hold.
    redirect(firstAllowedPath(actor));
  }

  const { error, signed_out: signedOut } = await searchParams;

  return (
    <main className="relative flex min-h-dvh flex-1 flex-col bg-[radial-gradient(1100px_560px_at_15%_-10%,rgba(45,212,191,0.10),transparent_55%),#0b1120] px-6 py-10">
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 ring-1 ring-accent/30">
              <span className="text-base font-black tracking-tight text-accent">
                sH
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-tight">
                syd<span className="text-accent">Hustle</span> Console
              </h1>
              <p className="text-xs text-muted-foreground">
                Operations, money and safety
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-7 shadow-xl shadow-black/30 backdrop-blur-sm">
            {signedOut && !error && (
              <p className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                You&apos;re signed out.
              </p>
            )}

            <h2 className="text-sm font-semibold">Sign in</h2>
            <p className="mb-5 mt-0.5 text-xs text-muted-foreground">
              Use the details you were invited with.
            </p>

            <ConsoleLoginForm error={errorMessage(error)} />
          </div>

          <div className="mt-5 space-y-2.5 text-xs text-muted-foreground">
            <p className="flex items-start gap-2">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Access is by invitation. What you can open depends on your role —
              ask whoever set up your account to change it.
            </p>
            <p className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Every visit is on the record.
            </p>
          </div>
        </div>
      </div>

      <footer className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          {SITE_NAME}
        </Link>
        <span aria-hidden className="opacity-40">
          ·
        </span>
        <Link href="/support" className="transition-colors hover:text-foreground">
          Support
        </Link>
        <span aria-hidden className="opacity-40">
          ·
        </span>
        <Link href="/privacy" className="transition-colors hover:text-foreground">
          Privacy
        </Link>
      </footer>
    </main>
  );
}
