import { SurveyForm } from "@/components/SurveyForm";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Survey",
  description:
    "Help shape sydHustle. Tell us whether you'd hustle, need a hustle, or both.",
  alternates: { canonical: "/survey" },
  /*
   * Deliberately out of the index.
   *
   * The app has shipped, so a search result reading "Survey | sydHustle"
   * describes a product that no longer exists. The page stays reachable
   * because moderators still share the link directly; it just stops
   * being something Google can rank or show.
   *
   * Note this is a meta tag and NOT a robots.txt Disallow. Blocking the
   * crawler would leave the existing result in place, because Google has
   * to fetch the page to discover the noindex. It gets removed only if
   * it can still be crawled.
   */
  robots: { index: false, follow: false },
  openGraph: {
    title: "Survey | sydHustle",
    description:
      "Help shape sydHustle. Tell us whether you'd hustle, need a hustle, or both.",
    url: "/survey",
  },
};

export default function SurveyPage() {
  return (
    <>
      <SiteHeader />
      <main className="relative flex-1 px-6 py-12 md:py-16">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="animate-blob-a absolute left-1/2 top-[-160px] h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-accent/15 blur-[130px]" />
        </div>
        <SurveyForm />
      </main>
      <Footer />
    </>
  );
}
