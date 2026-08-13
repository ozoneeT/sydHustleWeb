import { FileText, ShieldCheck, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Terms and Policies",
  description:
    "Every sydHustle policy in one place — the Terms & Conditions you agree to, how your data is handled, and what is and isn't allowed on the platform.",
  alternates: { canonical: "/policies_center" },
};

/**
 * The policies hub — one address that fans out to every legal and
 * policy document, so "where do I find the rules" has a single answer
 * that app screens, store listings and support replies can all link.
 */

const POLICIES: {
  href: string;
  icon: ReactNode;
  title: string;
  blurb: string;
}[] = [
  {
    href: "/legal/terms",
    icon: <FileText className="h-7 w-7" />,
    title: "Terms & Conditions",
    blurb: "The agreement you accept when you use sydHustle.",
  },
  {
    href: "/privacy",
    icon: <ShieldCheck className="h-7 w-7" />,
    title: "Privacy Policy",
    blurb: "The information we collect, and how it's used and protected.",
  },
  {
    href: "/policies_center/community_standard",
    icon: <Users className="h-7 w-7" />,
    title: "Community Standards",
    blurb: "What isn't allowed, and how to report it when you see it.",
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
                {/* An icon tile stands where a photograph would: the
                    site has no illustration library, and an empty image
                    slot is worse than an honest glyph. */}
                <div className="flex h-36 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 via-accent/5 to-transparent text-accent">
                  {policy.icon}
                </div>
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
