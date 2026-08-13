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
            href="/policies_center"
            className="transition-colors hover:text-foreground"
          >
            Terms and Policies
          </Link>
          <Link
            href="/legal/terms"
            className="transition-colors hover:text-foreground"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="transition-colors hover:text-foreground"
          >
            Privacy
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
    </footer>
  );
}
