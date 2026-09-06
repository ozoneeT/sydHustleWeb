import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { readConsoleSession } from "@/lib/console/session";
import { permissionsForStaff } from "@/lib/console/staff";
import { CONSOLE_TAB_KEYS, type ConsoleTab } from "@/lib/console/tabs";

/**
 * The console's authorization boundary. Every page and every server action
 * starts here; no session, no page.
 *
 * `requireConsole` takes the tab the caller belongs to, and that argument is
 * NOT optional on purpose. Server actions are reachable by direct POST, not
 * only through the UI, so an action that forgot to say which tab it belongs
 * to would be an open door for any signed-in staff member. Making the
 * argument required turns "did we remember to check?" into a compile error.
 *
 * Pass `"any"` only where the check genuinely is "is anyone signed in" —
 * logging out, reading your own profile.
 */

export type ConsoleActor =
  | { kind: "super"; permissions: ConsoleTab[] }
  | {
      kind: "staff";
      id: string;
      name: string;
      email: string;
      permissions: ConsoleTab[];
    };

/**
 * Resolved once per request.
 *
 * For staff this re-reads their roles from the database rather than
 * trusting the token's cached copy, so a permission removed in /admin takes
 * effect on their very next click instead of at the end of their session.
 */
export const getConsoleActor = cache(async (): Promise<ConsoleActor | null> => {
  const session = await readConsoleSession();
  if (!session) return null;

  if (!session.sid) {
    return { kind: "super", permissions: [...CONSOLE_TAB_KEYS] };
  }

  const resolved = await permissionsForStaff(session.sid);
  // Suspended, deleted, or a token for a staff row that no longer exists.
  if (!resolved) return null;

  return {
    kind: "staff",
    id: resolved.staff.id,
    name: resolved.staff.name,
    email: resolved.staff.email,
    permissions: resolved.permissions,
  };
});

export function actorCan(actor: ConsoleActor, tab: ConsoleTab): boolean {
  return actor.kind === "super" || actor.permissions.includes(tab);
}

/**
 * Gate for a page or a server action.
 *
 * A missing session goes to the login page. A valid session without the tab
 * goes to /console/denied rather than the login page — being told to sign in
 * again when you are already signed in is the most confusing possible answer
 * to "you don't have access to this".
 */
export const requireConsole = cache(
  async (tab: ConsoleTab | "any"): Promise<ConsoleActor> => {
    const actor = await getConsoleActor();
    // Not "/console": a cookie that still verifies but resolves to nobody
    // has to be cleared, and only a route handler may do that.
    if (!actor) redirect("/console/signed-out");

    if (tab !== "any" && !actorCan(actor, tab)) {
      redirect(`/console/denied?tab=${tab}`);
    }

    return actor;
  }
);

/** Where to send someone who has landed on a page they can't open. */
export function firstAllowedPath(actor: ConsoleActor): string {
  if (actor.kind === "super") return "/console/overview";
  const first = actor.permissions[0];
  return first ? `/console/${first}` : "/console/denied";
}

/**
 * The same check without the redirect, for route handlers that must answer
 * with a status code rather than an HTML page.
 */
export async function consoleActorCan(tab: ConsoleTab): Promise<boolean> {
  const actor = await getConsoleActor();
  return actor ? actorCan(actor, tab) : false;
}
