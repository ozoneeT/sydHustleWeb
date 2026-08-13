"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";

/**
 * The other way a page can fail to appear.
 *
 * A 404 means "that address is wrong"; this means "the address was
 * right and we broke". Saying so plainly matters, because the two need
 * opposite responses from the reader: one should try a different link,
 * the other should try the same one again.
 *
 * Must be a client component — that is how React hands it the error
 * boundary's `reset`, which re-renders the segment without a full page
 * load. The error itself is never printed: a stack trace on a public
 * page tells an attacker about the stack and tells everyone else
 * nothing.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server errors carry a digest that matches the server log line, so
    // a report of "it said EA31B0" can be traced to the actual failure.
    console.error("[sydHustle]", error.digest ?? error.message);
  }, [error]);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 pb-24 pt-28 md:pt-32">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            Something went wrong
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            That&apos;s on us, not you.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-muted-foreground">
            This page failed to load. It is usually temporary &mdash; trying
            again is worth doing before anything else.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              className="rounded-full bg-accent px-6 py-3 text-sm font-bold text-black transition-opacity hover:opacity-90"
              onClick={reset}
              type="button"
            >
              Try again
            </button>
            <Link
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-accent/40"
              href="/"
            >
              Go home
            </Link>
          </div>

          {error.digest ? (
            <p className="mt-10 text-sm leading-6 text-muted-foreground">
              If it keeps happening, send us this reference and we&apos;ll find
              it in the logs:{" "}
              <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-foreground">
                {error.digest}
              </code>{" "}
              &mdash;{" "}
              <a
                className="text-accent underline-offset-4 hover:underline"
                href="mailto:support@sydhustle.com"
              >
                support@sydhustle.com
              </a>
            </p>
          ) : (
            <p className="mt-10 text-sm leading-6 text-muted-foreground">
              If it keeps happening, tell us what you were doing &mdash;{" "}
              <a
                className="text-accent underline-offset-4 hover:underline"
                href="mailto:support@sydhustle.com"
              >
                support@sydhustle.com
              </a>
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
