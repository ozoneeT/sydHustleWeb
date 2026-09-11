"use client";

import { motion } from "framer-motion";
import { StoreBadges } from "@/components/home/StoreBadges";

/**
 * The last screen before the footer.
 *
 * The reference ends on light, with the download badges as the only
 * thing to do on the page. Same here — everything above has been an
 * argument for one action, so nothing else competes with it.
 */
export function ClosingCta() {
  return (
    <section
      id="get-the-app"
      className="relative scroll-mt-24 overflow-hidden bg-[linear-gradient(to_bottom,#ffffff_0%,#e6faf5_42%,#8fe2d3_100%)] px-6 pb-[12vh] pt-[12vh] text-center text-[#0b1a18]"
    >

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.85, ease: [0.19, 1, 0.22, 1] }}
        className="relative mx-auto max-w-[46rem]"
      >
        <h2 className="t-h2 text-balance">
          Welcome to the <span className="text-[#0b7a6e]">Hustle.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-[32rem] text-balance text-[length:var(--fs-lead)] leading-[1.45] text-[#3f524e]">
          Free to download. Post your first Hustle in under a minute.
        </p>
        <StoreBadges className="mt-9 flex-col justify-center gap-3 sm:flex-row" />
      </motion.div>

      {/* Three tokens drifting in the wash, the way the reference floats
          coins across its closing panel. */}
      {[
        "left-[8%] top-[38%] levitate-a",
        "right-[12%] top-[30%] levitate-b",
        "left-[22%] bottom-[14%] levitate-b",
      ].map((position, i) => (
        <span
          key={i}
          aria-hidden
          className={`pointer-events-none absolute hidden h-12 w-12 rounded-full bg-[radial-gradient(circle_at_32%_30%,#ffffff,#5eead4_45%,#0f766e_100%)] opacity-70 shadow-[0_0.8rem_1.6rem_-0.4rem_rgba(4,33,29,0.4)] sm:block ${position}`}
        />
      ))}
    </section>
  );
}
