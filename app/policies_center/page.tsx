import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Terms and Policies",
  description:
    "Every sydHustle policy in one place, the Terms & Conditions you agree to, how your data is handled, and what is and isn't allowed on the platform.",
  alternates: { canonical: "/policies_center" },
};

/**
 * The policies hub, one address that fans out to every legal and
 * policy document, so "where do I find the rules" has a single answer
 * that app screens, store listings and support replies can all link.
 */

const POLICIES: {
  href: string;
  /** Optional: a card with no illustration yet falls back to its initial. */
  image?: string;
  alt?: string;
  title: string;
  blurb: string;
}[] = [
  {
    href: "/legal/terms",
    image: "/policies/terms.webp",
    alt: "Illustration of a Terms & Conditions document on a clipboard",
    title: "Terms & Conditions",
    blurb: "The agreement you accept when you use sydHustle.",
  },
  {
    href: "/privacy",
    image: "/policies/privacy.webp",
    alt: "Illustration of a Privacy Policy document with a shield and lock",
    title: "Privacy Policy",
    blurb: "The information we collect, and how it's used and protected.",
  },
  {
    href: "/policies_center/community_standard",
    image: "/policies/community.webp",
    alt: "Illustration of three people standing together under a shield",
    title: "Community Standards",
    blurb: "What isn't allowed, and how to report it when you see it.",
  },
  {
    href: "/delete-account",
    title: "Delete your account",
    blurb:
      "How to close your account, what that removes, and what we have to keep.",
  },
];

export default function PoliciesCenterPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 pb-24 pt-28 md:pt-32">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            Terms and Policies
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl">
            Everything you need to know, all in one place.
          </h1>

          <p className="mt-16 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            How we work
          </p>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {POLICIES.map((policy) => (
              <Link
                className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-accent/40 hover:bg-white/[0.04]"
                href={policy.href}
                key={policy.href}
              >
                {/* Square source shown square: the illustrations are
                    complete compositions, and cropping one to a banner
                    would cut the thing it is a picture of. 720px WebP,
                    2x the card's rendered width, from the original
                    2MB PNGs, so the illustrated three together cost less
                    than a tenth of one original.

                    A card with no illustration yet shows its initial at
                    the same aspect ratio, so the grid keeps its rhythm
                    instead of collapsing one cell. */}
                {policy.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={policy.alt ?? ""}
                    className="aspect-square w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    height={720}
                    loading="lazy"
                    src={policy.image}
                    width={720}
                  />
                ) : (
                  <div
                    aria-hidden
                    className="flex aspect-square w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] transition-transform duration-300 group-hover:scale-[1.02]"
                  >
                    <span className="text-6xl font-extrabold tracking-tight text-accent/30">
                      {policy.title.charAt(0)}
                    </span>
                  </div>
                )}
                <h2 className="mt-5 text-lg font-bold tracking-tight text-foreground group-hover:text-accent">
                  {policy.title}
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  {policy.blurb}
                </p>
              </Link>
            ))}
          </div>

          <p className="mt-14 max-w-2xl text-sm leading-6 text-muted-foreground">
            Questions about any of these? Reach us at{" "}
            <a
              className="text-accent underline-offset-4 hover:underline"
              href="mailto:support@sydhustle.com"
            >
              support@sydhustle.com
            </a>{" "}
            or on WhatsApp at{" "}
            <a
              className="text-accent underline-offset-4 hover:underline"
              href="https://wa.me/2347088569014"
              rel="noopener noreferrer"
              target="_blank"
            >
              0708&nbsp;856&nbsp;9014
            </a>
            .
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
