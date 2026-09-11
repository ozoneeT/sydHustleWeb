"use client";

import { useRef } from "react";
import { MotionValue, motion, useTransform } from "framer-motion";
import {
  CROSSING,
  useSectionProgress,
} from "@/components/home/useSectionProgress";

/**
 * The single-line statement between the hero and the benefits.
 *
 * The words light up one at a time as the line crosses the middle of the
 * window — the same device the reference uses to slow the reader down
 * between two heavy sections.
 */
export function Statement({
  words,
  accentFrom = words.length - 1,
}: {
  words: string[];
  /** Index of the first word painted in the brand colour. */
  accentFrom?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const progress = useSectionProgress(ref, CROSSING);

  return (
    <section className="relative px-6 pb-[6vh] pt-[26vh]">
      <div ref={ref} className="mx-auto max-w-[52rem]">
        <p className="t-h2 flex flex-wrap justify-center gap-x-[0.28em] gap-y-[0.1em] text-center">
          {words.map((word, i) => (
            <Word
              key={`${word}-${i}`}
              word={word}
              progress={progress}
              index={i}
              total={words.length}
              accent={i >= accentFrom}
            />
          ))}
        </p>
      </div>
    </section>
  );
}

function Word({
  word,
  progress,
  index,
  total,
  accent,
}: {
  word: string;
  progress: MotionValue<number>;
  index: number;
  total: number;
  accent: boolean;
}) {
  const start = index / total;
  const end = start + 1 / total;
  const opacity = useTransform(progress, [start, end], [0.16, 1]);

  return (
    <motion.span
      style={{ opacity }}
      className={accent ? "t-accent" : "text-white"}
    >
      {word}
    </motion.span>
  );
}
