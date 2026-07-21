"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-md transition-colors duration-300",
        scrolled
          ? "border-white/10 bg-background/85 shadow-lg shadow-black/20"
          : "border-transparent bg-background/40"
      )}
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-xl font-bold tracking-tight transition-opacity hover:opacity-80"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sydhustle-icon.webp"
            alt="sydHustle app icon — geometric teal S mark"
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
          <span>
            syd<span className="text-accent">Hustle</span>
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/survey"
            className="group relative text-muted-foreground transition-colors hover:text-foreground"
          >
            Survey
            <span className="absolute -bottom-1 left-0 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
          </Link>
          <a
            href="#waitlist"
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-md shadow-accent/25 transition-all hover:scale-[1.03] hover:bg-accent/90 hover:shadow-accent/40 active:scale-[0.98]"
          >
            Join waitlist
          </a>
        </nav>
      </div>
    </motion.header>
  );
}
