import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VoiceSection() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-3xl rounded-3xl border border-accent/20 bg-accent/5 p-8 text-center md:p-12">
        <MessageSquare className="mx-auto mb-4 h-10 w-10 text-accent" />
        <h2 className="text-2xl font-bold md:text-3xl">Why your voice matters</h2>
        <p className="mt-4 text-muted-foreground">
          We&apos;re in a survey period right now. Before we write a single line
          of production code, we want to hear from real students — whether
          sydHustle is something you&apos;d actually use. Survey respondents get
          priority early access when we launch.
        </p>
        <Button asChild className="mt-8" size="lg">
          <Link href="/survey">Share your thoughts — 2 min survey</Link>
        </Button>
      </div>
    </section>
  );
}
