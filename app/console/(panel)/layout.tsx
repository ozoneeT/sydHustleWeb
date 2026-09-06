import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { ConsoleNav } from "@/components/console/ConsoleNav";
import { getConsoleActor } from "@/lib/console/dal";

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

/**
 * The layout resolves who is signed in so the sidebar can show their tabs
 * and nobody else's. It is async now, which costs a Supabase read per
 * navigation for staff — the superadmin's session needs none.
 *
 * This is presentation, not authorization: every page under here calls
 * `requireConsole` with its own tab, and the proxy checks the URL before
 * either of them runs. Hiding a link the person can't use is a courtesy.
 */
export default async function ConsolePanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const actor = await getConsoleActor();
  if (!actor) redirect("/console/signed-out");

  return (
    <ConsoleNav
      permissions={actor.permissions}
      actorLabel={actor.kind === "super" ? "Superadmin" : actor.name}
      isSuperAdmin={actor.kind === "super"}
    >
      {children}
    </ConsoleNav>
  );
}
