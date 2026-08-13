import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Not found — Console",
  robots: { index: false, follow: false },
};

/**
 * The console's own 404.
 *
 * Deliberately not the site's: that one wears the marketing header and
 * a "Join waitlist" button, which is nonsense to show someone who is
 * already signed in and administering the platform. Everything under
 * /console is noindex, so this is chrome for one person having a bad
 * moment rather than a page anyone will find.
 */
export default function ConsoleNotFound() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
          404
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
          No such console page
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          That address isn&apos;t part of the console. It may have been renamed,
          or the link may be from an older build.
        </p>
        <Link
          className="mt-8 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-bold text-black transition-opacity hover:opacity-90"
          href="/console/overview"
        >
          Back to the console
        </Link>
      </div>
    </main>
  );
}
