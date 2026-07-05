import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 px-6 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
        <p>&copy; {new Date().getFullYear()} sydHustle. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="/survey" className="hover:text-foreground transition-colors">
            Take the survey
          </Link>
          <a href="#waitlist" className="hover:text-foreground transition-colors">
            Join waitlist
          </a>
        </div>
      </div>
    </footer>
  );
}
