import Link from "next/link";
import { BRAND_ASSETS, SUPPORT_EMAIL } from "@/lib/site";

/**
 * The footer.
 *
 * One live contact address stated plainly and at size — both stores
 * require a working support route from the listing, and this is the page
 * that route points at.
 */
export function SiteFooter() {
  return (
    <footer className="relative bg-[#050506] px-6 pb-10 pt-14">
      <div className="mx-auto max-w-[72rem]">
        <div className="flex flex-col gap-6 border-b border-white/10 pb-10 md:flex-row md:items-end md:justify-between">
          <p className="t-h3 text-white">Contact us</p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="t-h4 text-[color:var(--accent-bright)] underline decoration-[color:var(--accent)]/40 underline-offset-[0.35em] transition-colors hover:text-[color:var(--accent-tint)]"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>

        <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BRAND_ASSETS.logo.path}
              alt={BRAND_ASSETS.logo.alt}
              width={BRAND_ASSETS.logo.width}
              height={BRAND_ASSETS.logo.height}
              className="h-6 w-auto"
            />
            <p className="text-sm text-[color:var(--muted-foreground)]">
              &copy; {new Date().getFullYear()} sydHustle. All rights reserved.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-[color:var(--muted-foreground)]">
            <Link href="/legal/terms" className="transition-colors hover:text-white">
              Terms of Service
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/policies_center" className="transition-colors hover:text-white">
              Policies
            </Link>
            <Link href="/support" className="transition-colors hover:text-white">
              Support
            </Link>
            <Link href="/delete-account" className="transition-colors hover:text-white">
              Delete account
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
