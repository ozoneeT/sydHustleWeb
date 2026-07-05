import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative mt-auto border-t border-white/10 px-6 py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
        <p>
          &copy; {new Date().getFullYear()}{" "}
          <span className="text-foreground">syd</span>
          <span className="text-accent">Hustle</span>. All rights reserved.
        </p>
        <div className="flex gap-6">
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
