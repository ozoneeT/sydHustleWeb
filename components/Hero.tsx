import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-16 md:pb-28 md:pt-24">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-accent/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[400px] rounded-full bg-accent/10 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-accent" />
          Development in progress
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl">
          Your side hustle,{" "}
          <span className="bg-gradient-to-r from-accent to-teal-300 bg-clip-text text-transparent">
            sorted.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          sydHustle is being built for students who want to earn on their own
          terms. Join the waitlist and take our quick survey to help shape what
          we build next.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg">
            <a href="#waitlist">Join the waitlist</a>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/survey">
              Take the survey
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
