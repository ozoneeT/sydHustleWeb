"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, HandHelping, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.21, 0.47, 0.32, 0.98] as const },
  },
};

const audiences = [
  {
    icon: Wallet,
    title: "Want to earn?",
    description:
      "Complete everyday hustles. Earn on your schedule.",
  },
  {
    icon: HandHelping,
    title: "Need a hand?",
    description: "Post a task and get help from fellow students, fast.",
  },
];

export function Hero() {
  return (
    <section className="relative px-6 pb-16 pt-16 md:pb-20 md:pt-24">
      <motion.div
        className="mx-auto max-w-4xl text-center"
        initial="hidden"
        animate="visible"
        variants={container}
      >
        <motion.div
          variants={item}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-pulse-ring absolute inline-flex h-2 w-2 rounded-full bg-accent" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          <Sparkles className="h-4 w-4 text-accent" />
          Development in progress
        </motion.div>

        <motion.h1
          variants={item}
          className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
        >
          Your side hustle,{" "}
          <span className="relative inline-block bg-gradient-to-r from-accent via-teal-300 to-accent bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer">
            sorted.
          </span>
        </motion.h1>

        <motion.p
          variants={item}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl"
        >
          sydHustle connects students who want to earn extra with students who
          need help getting things done. Join the waitlist and take our quick
          survey to help shape what we build next.
        </motion.p>

        <motion.div
          variants={item}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button asChild size="lg" className="group">
            <a href="#waitlist">
              Join the waitlist
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </Button>
          <Button asChild variant="secondary" size="lg" className="group">
            <Link href="/survey">
              Take the survey
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </motion.div>

        <motion.div
          variants={item}
          className="mx-auto mt-14 grid max-w-xl gap-4 sm:grid-cols-2"
        >
          {audiences.map((audience) => (
            <motion.div
              key={audience.title}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur-sm transition-colors hover:border-accent/30"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent/20">
                <audience.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">{audience.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {audience.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
