import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Page not found",
  description:
    "That sydHustle page doesn't exist. Here's where to go instead.",
  // A 404 has nothing to index, and letting one be indexed is how a dead
  // URL ends up outranking a live one for the same words.
  robots: { index: false, follow: true },
};

/**
 * The site's 404.
 *
 * Next's default is an unstyled black-on-white line of text, which on a
 * mistyped URL reads as "this site is broken" rather than "that page
 * isn't here". This is the same chrome as every other page, says plainly
 * that nothing is wrong with the reader's end, and — the part that
 * actually matters — offers somewhere to go, because a dead end with no
 * exits is the reason people close the tab instead of trying again.
 */

const DESTINATIONS = [
  {
    href: "/",
    title: "Home",
    blurb: "What sydHustle is, and how to get on the waitlist.",
  },
  {
    href: "/policies_center",
    title: "Terms and Policies",
    blurb: "The rules, your data, and what isn't allowed.",
  },
  {
    href: "/survey",
    title: "Take the survey",
    blurb: "Two minutes, and it shapes what we build next.",
  },
];

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 pb-24 pt-28 md:pt-32">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            404 — page not found
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            This one&apos;s not on the list.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-muted-foreground">
            The page you asked for doesn&apos;t exist — the link may be old, or
            the address may have a typo in it. Nothing is broken on your end.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {DESTINATIONS.map((destination) => (
              <Link
                className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-accent/40 hover:bg-white/[0.04]"
                href={destination.href}
                key={destination.href}
              >
                <h2 className="text-base font-bold tracking-tight text-foreground group-hover:text-accent">
                  {destination.title}
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  {destination.blurb}
                </p>
              </Link>
            ))}
          </div>

          <p className="mt-10 text-sm leading-6 text-muted-foreground">
            Landed here from a link we sent? Tell us where it was and
            we&apos;ll fix it &mdash;{" "}
            <a
              className="text-accent underline-offset-4 hover:underline"
              href="mailto:support@sydhustle.com"
            >
              support@sydhustle.com
            </a>
            .
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
