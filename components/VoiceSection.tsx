"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/Reveal";

export function VoiceSection() {
  return (
    <section className="relative px-6 py-16 md:py-24">
      <Reveal className="mx-auto max-w-3xl">
        <div className="group relative overflow-hidden rounded-3xl border border-accent/20 bg-accent/5 p-8 text-center md:p-12">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-accent/10 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent"
          >
            <MessageSquare className="h-7 w-7" />
          </motion.div>

          <h2 className="text-2xl font-bold md:text-3xl">
            Why your voice matters
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            We&apos;re in a survey period right now. Before we write a single
            line of production code, we want to hear from real students —
            whether you&apos;d use sydHustle to earn, to get help with a task,
            or both. Survey respondents get priority early access when we
            launch.
          </p>
          <Button asChild className="group/btn mt-8" size="lg">
            <Link href="/survey">
              Share your thoughts — takes a few minutes
              <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
