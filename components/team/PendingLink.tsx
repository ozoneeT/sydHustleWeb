"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";

/**
 * A link that admits it is doing something.
 *
 * Both team pages are `force-dynamic`, so moving between sign-in and
 * sign-up is a server round trip with nothing on screen to show for it.
 * `useLinkStatus` only works from inside the `<Link>` it belongs to, which
 * is why the spinner is a child component rather than a prop.
 */
function PendingDot() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return <Loader2 className="ml-1 inline h-3 w-3 animate-spin align-[-1px]" />;
}

export function PendingLink({
  children,
  className,
  href,
}: {
  children: React.ReactNode;
  className?: string;
  href: string;
}) {
  return (
    <Link className={className} href={href}>
      {children}
      <PendingDot />
    </Link>
  );
}
