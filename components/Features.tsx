"use client";

import { motion } from "framer-motion";
import { Briefcase, HandHelping, Users } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { StaggerGroup, staggerItem } from "@/components/motion/Stagger";

const features = [
  {
    icon: Briefcase,
    title: "Earn from side hustles",
    description:
      "Find gigs, tutor, freelance, and get paid for your time and skills — on your terms.",
  },
  {
    icon: HandHelping,
    title: "Get help with tasks",
    description:
      "Post what you need done and get matched with students ready to help, fast.",
  },
  {
    icon: Users,
    title: "Built with community",
    description:
      "Trusted student profiles, reviews, and tools that make both sides feel safe.",
  },
];

export function Features() {
  return (
    <section className="relative px-6 py-20 md:py-28">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mb-14 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            What we&apos;re building
          </h2>
          <p className="mt-4 text-muted-foreground">
            A two-sided platform for students — still early days, your
            feedback decides what comes first.
          </p>
        </Reveal>

        <StaggerGroup className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={staggerItem}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-sm transition-colors hover:border-accent/30"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-accent/0 blur-2xl transition-colors duration-500 group-hover:bg-accent/20" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent/20">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="relative mt-4 text-lg font-semibold">
                {feature.title}
              </h3>
              <p className="relative mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
