import { SurveyorSignupForm } from "@/components/moderator/SurveyorSignupForm";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Surveyor sign up — sydHustle",
  description: "Sign up as a sydHustle surveyor and get your unique PIN.",
};

export default function SurveyorSignupPage() {
  return (
    <>
      <SiteHeader />
      <main className="relative flex-1 px-6 py-12 md:py-16">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="animate-blob-a absolute left-1/2 top-[-160px] h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-accent/15 blur-[130px]" />
        </div>
        <SurveyorSignupForm />
      </main>
      <Footer />
    </>
  );
}
