import { SurveyForm } from "@/components/SurveyForm";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Survey — sydHustle",
  description:
    "Help shape sydHustle. Take our 2-minute student side hustle survey.",
};

export default function SurveyPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 py-12 md:py-16">
        <SurveyForm />
      </main>
      <Footer />
    </>
  );
}
