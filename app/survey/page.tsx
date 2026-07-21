import { SurveyForm } from "@/components/SurveyForm";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Survey",
  description:
    "Help shape sydHustle. Tell us whether you'd hustle, need a hustle, or both.",
  alternates: { canonical: "/survey" },
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
