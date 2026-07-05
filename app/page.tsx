import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { VoiceSection } from "@/components/VoiceSection";
import { WaitlistForm } from "@/components/WaitlistForm";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Features />
        <VoiceSection />
        <section id="waitlist" className="scroll-mt-24 px-6 py-20">
          <WaitlistForm />
        </section>
      </main>
      <Footer />
    </>
  );
}
