import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";

import { TeamLoginForm } from "@/components/team/TeamLoginForm";
import { PendingLink } from "@/components/team/PendingLink";
import { getTeamActor } from "@/lib/team/dal";
import { SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Team — sydHustle",
  robots: { index: false, follow: false },
};

function errorMessage(code: string | undefined): string | null {
  switch (code) {
    case "invalid":
      return "That number and password don't match.";
    case "config":
      return "Team sign-in isn't configured on this deployment.";
    case "expired":
      return "Your session ended. Sign in again to carry on.";
    default:
      return null;
  }
}

/**
 * The team's front door.
 *
 * Deliberately its own address rather than a corner of the console: the
 * people who sign in here are building sydHustle, not running it, and
 * nothing they can reach touches money or user records.
 */
export default async function TeamLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; signed_out?: string }>;
}) {
  const member = await getTeamActor();
  if (member) redirect("/team/dashboard");

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
                syd<span className="text-accent">Hustle</span> Team
              </h1>
              <p className="text-xs text-muted-foreground">
                The record of what you built
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
              With the phone number you were added with.
            </p>

            <TeamLoginForm error={errorMessage(error)} />

            <p className="mt-6 border-t border-white/10 pt-5 text-xs text-muted-foreground">
              First time here?{" "}
              <PendingLink
                className="font-medium text-accent underline-offset-4 hover:underline"
                href="/team/join"
              >
                Set up your account
              </PendingLink>
            </p>
          </div>

          <div className="mt-5 space-y-2.5 text-xs text-muted-foreground">
            <p className="flex items-start gap-2">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Only numbers already on the team list can sign up. If yours
              isn&apos;t working yet, ask whoever runs the team to add it.
            </p>
            <p className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Forgotten your password? It can&apos;t be emailed to you — ask for
              a reset and sign up again with the same number.
            </p>
          </div>
        </div>
      </div>

      <footer className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <Link className="transition-colors hover:text-foreground" href="/">
          {SITE_NAME}
        </Link>
        <span aria-hidden className="opacity-40">
          ·
        </span>
        <Link className="transition-colors hover:text-foreground" href="/support">
          Support
        </Link>
        <span aria-hidden className="opacity-40">
          ·
        </span>
        <Link className="transition-colors hover:text-foreground" href="/privacy">
          Privacy
        </Link>
      </footer>
    </main>
  );
}
