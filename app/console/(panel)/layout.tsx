import type { ReactNode } from "react";

import { ConsoleNav } from "@/components/console/ConsoleNav";

export const metadata = {
  robots: { index: false, follow: false },
};

/**
 * Nothing under /console is ever prerendered.
 *
 * Next statically renders a route unless something forces it dynamic, and
 * a Supabase read through the service-role client is not something it
 * counts. So pages like /console/appeals were being baked at BUILD time
 * and served from that snapshot: an appeals queue that could not show an
 * appeal filed after the last deploy, and refreshing did nothing because
 * there was nothing to re-run. Silent, and invisible in dev where every
 * route is dynamic anyway.
 *
 * Declared on the layout rather than page by page because the rule is not
 * per page: this whole section is a live operational view of the
 * database, behind auth, indexed by nobody. There is no page here that
 * should ever be a snapshot, so no page here should have to remember to
 * say so.
 */
export const dynamic = "force-dynamic";

// Auth is enforced in proxy.ts for /console/* so this layout stays sync —
// that lets loading.tsx show instantly on client navigations.

export default function ConsolePanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ConsoleNav>{children}</ConsoleNav>;
}
