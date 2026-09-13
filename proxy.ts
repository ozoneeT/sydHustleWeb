import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { CONSOLE_COOKIE, readConsoleToken } from "@/lib/console/session";
import { tabForPath } from "@/lib/console/tabs";
import { TEAM_COOKIE, readTeamToken } from "@/lib/team/session";

/**
 * Console routes are gated here so the panel layout can stay sync and
 * navigations can show loading.tsx immediately.
 *
 * The permission check here is OPTIMISTIC and exists for speed: it reads
 * the tab list cached in the session token, which costs nothing, rather
 * than the roles table, which would be a database round trip on every
 * navigation. The authoritative check is `requireConsole` in each page and
 * each server action — that re-reads the roles, so access removed in /admin
 * stops working on the very next request even though this token still
 * claims it.
 *
 * The two can therefore disagree for up to one session, and the direction
 * of the disagreement is what matters: this can wave through a request that
 * the DAL then refuses, which is fine. It can never grant something the DAL
 * would allow but the token omits, because the token is written from the
 * same roles at login.
 *
 * /admin checks its own session inside its pages (it renders a login form
 * in place rather than redirecting), so it needs nothing here.
 *
 * /team is gated the same way but has no permissions to weigh: a team
 * member can do one thing, so the only question here is whether the
 * cookie verifies. Whether the account behind it is still active is the
 * DAL's to answer on every request.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/console/")) {
    // Login POST and the invitation flow stay public; everything else under
    // /console/* needs a session.
    if (
      pathname === "/console/login" ||
      pathname === "/console/accept" ||
      pathname === "/console/signed-out"
    ) {
      return NextResponse.next();
    }

    const claims = await readConsoleToken(request.cookies.get(CONSOLE_COOKIE)?.value);
    if (!claims) {
      return NextResponse.redirect(new URL("/console", request.url));
    }

    // No `sid` means the superadmin, who holds every tab.
    if (claims.sid) {
      const tab = tabForPath(pathname);
      if (tab && !(claims.perms ?? []).includes(tab)) {
        return NextResponse.redirect(
          new URL(`/console/denied?tab=${tab}`, request.url)
        );
      }
    }
  }

  if (pathname.startsWith("/team/")) {
    // Sign-in, sign-up and the sign-out route stay public. So does the
    // upload endpoint, which answers with a 401 of its own — redirecting a
    // fetch() for a signed upload URL to an HTML login page would surface
    // as an unreadable JSON parse error rather than "you're signed out".
    if (
      pathname === "/team/login" ||
      pathname === "/team/join" ||
      pathname === "/team/signed-out" ||
      pathname.startsWith("/team/api/")
    ) {
      return NextResponse.next();
    }

    const claims = await readTeamToken(
      request.cookies.get(TEAM_COOKIE)?.value
    );
    if (!claims) {
      return NextResponse.redirect(new URL("/team", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/console/:path*", "/team/:path*"],
};
