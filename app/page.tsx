import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { VoiceSection } from "@/components/VoiceSection";
import { WaitlistForm } from "@/components/WaitlistForm";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/motion/Reveal";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Features />
        <VoiceSection />
        <section
          id="waitlist"
          className="relative scroll-mt-24 px-6 py-20 md:py-28"
        >
          <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-60" />
          <Reveal className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Ready when you are
            </h2>
            <p className="mt-4 text-muted-foreground">
              Two minutes now saves you guessing later — join the waitlist.
            </p>
          </Reveal>
          <WaitlistForm />
        </section>
      </main>
      <Footer />
    </>
  );
}
