"use client";

import { RefObject, useEffect, useState } from "react";
import { MotionValue, useScroll, useTransform } from "framer-motion";

/**
 * Scroll progress across one section, measured from the page.
 *
 * `useScroll({ target })` measures its target once and does not always
 * catch the reflows this page causes — web fonts land, screenshots
 * decode, `svh` resolves on mobile — and a stale measurement quietly
 * skews every value derived from it: the tunnel was reporting 93% while
 * the section was 59% scrolled, which is why its cards had already flown
 * past by the time they were on screen.
 *
 * So progress is computed here instead, from the page's own `scrollY`
 * against a range this hook re-measures whenever the layout can have
 * moved. One source, re-derived on demand, and every value on a section
 * stays in step with every other.
 */

export type SectionMetrics = {
  /** Distance from the top of the document to the top of the section. */
  top: number;
  height: number;
  vh: number;
};

/** Scroll range, in document pixels, that maps to progress 0 → 1. */
export type SectionRange = (m: SectionMetrics) => [number, number];

/** For a section that pins a sticky stage: starts when its top reaches
 *  the top of the window, ends when its bottom reaches the bottom. */
export const PINNED: SectionRange = ({ top, height, vh }) => [
  top,
  top + height - vh,
];

/** For a section that simply travels through the window. */
export const THROUGH: SectionRange = ({ top, height, vh }) => [
  top - vh,
  top + height,
];

/** For copy that should resolve while it crosses the middle. */
export const CROSSING: SectionRange = ({ top, height, vh }) => [
  top - vh * 0.85,
  top + height - vh * 0.4,
];

export function useSectionProgress(
  ref: RefObject<HTMLElement | null>,
  range: SectionRange,
): MotionValue<number> {
  const { scrollY } = useScroll();
  const [bounds, setBounds] = useState<[number, number]>([0, 1]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const [from, to] = range({
        top: rect.top + window.scrollY,
        height: rect.height,
        vh: window.innerHeight,
      });
      setBounds(([prevFrom, prevTo]) => {
        const next: [number, number] = [from, Math.max(from + 1, to)];
        return prevFrom === next[0] && prevTo === next[1] ? [prevFrom, prevTo] : next;
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    observer.observe(document.documentElement);
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);
    document.fonts?.ready.then(measure).catch(() => {});

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("load", measure);
    };
  }, [ref, range]);

  return useTransform(scrollY, bounds, [0, 1], { clamp: true });
}
