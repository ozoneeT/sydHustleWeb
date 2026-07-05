import { ModeratorLoginForm } from "@/components/moderator/ModeratorLoginForm";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Moderator login — sydHustle",
  description: "Log in to your sydHustle surveyor or admin dashboard.",
};

export default function ModeratorPage() {
  return (
    <>
      <SiteHeader />
      <main className="relative flex-1 px-6 py-12 md:py-16">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="animate-blob-a absolute left-1/2 top-[-160px] h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-accent/15 blur-[130px]" />
        </div>
        <ModeratorLoginForm />
      </main>
      <Footer />
    </>
  );
}
