"use client";

import { useRef } from "react";
import { motion, useTransform } from "framer-motion";
import {
  THROUGH,
  useSectionProgress,
} from "@/components/home/useSectionProgress";
import { BadgeCheck, Lock, Star } from "lucide-react";
import { PhoneFrame, PhoneScreen } from "@/components/home/PhoneFrame";

/**
 * The product panel.
 *
 * A single lit stage — device on a pale floor, callouts floating beside
 * it — with the headline split into two grey words that sit either side
 * of the device, so the eye lands on the screen before the words. The
 * panel itself scales up slightly on entry, which is what gives the
 * section its "the lights come on" feel in the reference.
 */
export function Showcase() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSectionProgress(ref, THROUGH);

  const panelScale = useTransform(progress, [0, 0.42], [0.86, 1]);
  const panelRadius = useTransform(
    progress,
    [0, 0.42],
    ["3rem", "2rem"],
  );
  const floorY = useTransform(progress, [0.1, 0.7], ["12%", "-6%"]);

  return (
    <section ref={ref} className="relative px-4 py-[4vh] md:px-8">
      <motion.div
        style={{ scale: panelScale, borderRadius: panelRadius }}
        className="relative mx-auto max-w-[92rem] overflow-hidden bg-[#08080a] ring-1 ring-inset ring-white/10"
      >
        {/* The pale floor the device stands on. */}
        <motion.div
          aria-hidden
          style={{ y: floorY }}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-[#e8eae9] via-[#c9d0ce]/70 to-transparent"
        />
        {/* The key light raking across from the right. */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-8%] top-[-26%] h-[105%] w-[68%] rotate-[24deg] bg-[radial-gradient(ellipse_closest-side_at_center,rgba(153,246,228,0.34),rgba(153,246,228,0.12)_42%,rgba(153,246,228,0.03)_66%,transparent_82%)]"
        />

        <div className="relative grid items-center gap-10 px-6 py-16 md:grid-cols-[1fr_auto_1fr] md:px-12 md:py-24">
          <Reveal className="order-2 text-center md:order-1 md:text-right">
            <p className="t-h2 t-ghost">One app.</p>
          </Reveal>

          <div className="order-1 mx-auto w-[min(62vw,268px)] md:order-2">
            <PhoneFrame className="levitate-a">
              <PhoneScreen
                src="/app/skills.webp"
                alt="The sydHustle Skills tab: barbers, hairstylists, tailors, electricians, house cleaning and plumbers, each with ratings and a starting price"
              />
            </PhoneFrame>
          </div>

          <Reveal className="order-3 space-y-8 text-center md:text-left">
            <p className="t-h2 t-ghost">Every Hustle.</p>

            <div className="flex flex-wrap justify-center gap-2.5 md:justify-start">
              {[
                { icon: BadgeCheck, label: "Verified profiles" },
                { icon: Lock, label: "Escrow held" },
                { icon: Star, label: "Rated every job" },
              ].map((chip) => (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.08] px-3.5 py-2 text-sm text-white"
                >
                  <chip.icon className="h-4 w-4 text-[color:var(--accent-bright)]" />
                  {chip.label}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </motion.div>
    </section>
  );
}

function Reveal({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
