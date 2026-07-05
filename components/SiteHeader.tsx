import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="text-xl font-bold tracking-tight">
          syd<span className="text-accent">Hustle</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/survey"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Survey
          </Link>
          <a
            href="#waitlist"
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
          >
            Join waitlist
          </a>
        </nav>
      </div>
    </header>
  );
}
