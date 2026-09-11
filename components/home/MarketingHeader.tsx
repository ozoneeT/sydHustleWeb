"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#safety", label: "Safety" },
  { href: "/support", label: "Support" },
];

/**
 * The header.
 *
 * Transparent over the hero — the device behind it is the page's first
 * impression and a bar would cut the top off it — and it only picks up a
 * background once you have scrolled past the opening copy.
 */
export function MarketingHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 120);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        scrolled
          ? "border-b border-white/8 bg-[#050506]/70 backdrop-blur-xl"
          : "border-b border-transparent",
        /* No scrim here. A darkened strip behind the bar has to end
           somewhere, and against the hero's light that end reads as a
           hard horizontal seam across the glow. The text carries its
           own contrast instead — see `header-legible` — which costs
           nothing visually. */
      )}
    >
      <div className="header-legible mx-auto flex h-14 max-w-[80rem] items-center justify-between px-5 md:h-16 md:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          aria-label="sydHustle home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sydhustle-icon.webp"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
          <span className="text-lg font-semibold tracking-tight text-white">
            syd<span className="text-[color:var(--accent-bright)]">Hustle</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-white/75 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative transition-colors hover:text-white"
            >
              {link.label}
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-[color:var(--accent)] transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        {/* Both stores live in the closing panel — sending Android users
            to an App Store link would be the wrong half of the launch. */}
        <a href="#get-the-app" className="magic-btn text-sm">
          <span className="magic-btn__label">Get the app</span>
        </a>
      </div>
    </motion.header>
  );
}
