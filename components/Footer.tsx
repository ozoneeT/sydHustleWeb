import Link from "next/link";
import { BRAND_ASSETS } from "@/lib/site";

export function Footer() {
  return (
    <footer className="relative mt-auto border-t border-white/10 px-6 py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex flex-col items-center gap-3 sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BRAND_ASSETS.logo.path}
            alt={BRAND_ASSETS.logo.alt}
            width={BRAND_ASSETS.logo.width}
            height={BRAND_ASSETS.logo.height}
            className="h-7 w-auto"
          />
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()}{" "}
            <span className="text-foreground">syd</span>
            <span className="text-accent">Hustle</span>. All rights reserved.
          </p>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link
            href="/terms"
            className="transition-colors hover:text-foreground"
          >
            Terms &amp; Conditions
          </Link>
          <Link
            href="/privacy"
            className="transition-colors hover:text-foreground"
          >
            Privacy Policy
          </Link>
          <Link
            href="/survey"
            className="transition-colors hover:text-foreground"
          >
            Take the survey
          </Link>
          <a
            href="#waitlist"
            className="transition-colors hover:text-foreground"
          >
            Join waitlist
          </a>
        </div>
      </div>
      {/* Linked brand marks so Google can crawl & index all logo variants */}
      <div className="mx-auto mt-6 flex max-w-5xl flex-wrap items-center justify-center gap-8 border-t border-white/5 pt-6">
        <a
          href={BRAND_ASSETS.icon.path}
          target="_blank"
          rel="noopener noreferrer"
          title={BRAND_ASSETS.icon.alt}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BRAND_ASSETS.icon.path}
            alt={BRAND_ASSETS.icon.alt}
            width={48}
            height={48}
            className="h-12 w-12 object-contain opacity-80 transition-opacity hover:opacity-100"
          />
        </a>
        <a
          href={BRAND_ASSETS.logoLight.path}
          target="_blank"
          rel="noopener noreferrer"
          title={BRAND_ASSETS.logoLight.alt}
          className="rounded-md bg-white px-3 py-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BRAND_ASSETS.logoLight.path}
            alt={BRAND_ASSETS.logoLight.alt}
            width={200}
            height={70}
            className="h-8 w-auto"
          />
        </a>
      </div>
    </footer>
  );
}
