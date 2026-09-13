import { NextResponse } from "next/server";

import { deleteTeamSession } from "@/lib/team/session";

export const dynamic = "force-dynamic";

/**
 * Clears a member cookie that no longer resolves to an active account —
 * suspended, reset, or deleted — and hands the browser back to sign-in.
 *
 * A route handler because a cookie cannot be modified while a page
 * renders. The DAL redirects here rather than clearing the cookie itself,
 * which is also what stops sign-in and the dashboard bouncing to each
 * other forever.
 */
export async function GET(request: Request) {
  await deleteTeamSession();
  return NextResponse.redirect(
    new URL("/team?error=expired", request.url),
    303
  );
}
