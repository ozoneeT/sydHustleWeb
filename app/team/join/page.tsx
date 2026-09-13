import Link from "next/link";
import { redirect } from "next/navigation";

import { TeamSignupForm } from "@/components/team/TeamSignupForm";
import { getTeamActor } from "@/lib/team/dal";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Set up your sydHustle team account",
  robots: { index: false, follow: false },
};

/**
 * Signing up.
 *
 * There is nothing to verify here beyond the number itself, because the
 * number IS the invitation: it was typed into the console by hand before
 * this page could do anything for the person reading it. Someone whose
 * number isn't on the list gets told so plainly rather than left guessing
 * at a password they were never going to have.
 */
export default async function TeamJoinPage() {
  const member = await getTeamActor();
  if (member) redirect("/team/dashboard");

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
              <p className="text-xs text-muted-foreground">Set up your account</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-7 shadow-xl shadow-black/30 backdrop-blur-sm">
            <p className="mb-5 text-xs text-muted-foreground">
              Your number has to be on the team list already. Once
              you&apos;re in, everything you post is kept against your name —
              that record is what a share gets worked out from when sydHustle
              starts earning.
            </p>

            <TeamSignupForm />

            <p className="mt-6 border-t border-white/10 pt-5 text-xs text-muted-foreground">
              Already set up?{" "}
              <Link
                className="font-medium text-accent underline-offset-4 hover:underline"
                href="/team"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
