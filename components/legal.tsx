import type { ReactNode } from "react";

/**
 * The typography of the legal pages — /terms and /privacy.
 *
 * One set of components rather than per-page styles so the two
 * documents cannot drift apart visually: a numbered clause on the
 * Privacy Policy is the same object as a numbered clause in the Terms.
 */

export function Clause({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
        {number}. {title}
      </h2>
      <div className="mt-4 space-y-4 text-[15px] leading-7 text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export function Sub({ n, children }: { n: string; children: ReactNode }) {
  return (
    <p>
      <span className="mr-2 font-semibold text-foreground/80">{n}</span>
      {children}
    </p>
  );
}

export function Term({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-foreground">{children}</span>;
}

/** The bordered lead-in / company-identity card. */
export function LegalCard({ children }: { children: ReactNode }) {
  return (
    <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-[15px] leading-7 text-muted-foreground">
      {children}
    </div>
  );
}
