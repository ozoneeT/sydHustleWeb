import { NextResponse } from "next/server";

import { deleteConsoleSession } from "@/lib/console/session";

export const dynamic = "force-dynamic";

/**
 * Clears a console cookie that no longer resolves to anybody — a suspended
 * account, or a staff row that has been deleted — and hands the browser
 * back to the sign-in page.
 *
 * It exists as a route handler because a cookie cannot be modified while a
 * page renders; Next only allows it in a Server Action or a Route Handler.
 * The panel layout and the DAL therefore redirect *here* rather than
 * clearing the cookie themselves, which is also what stops the sign-in page
 * and the panel bouncing to each other forever.
 */
export async function GET(request: Request) {
  await deleteConsoleSession();
  return NextResponse.redirect(new URL("/console?error=expired", request.url), 303);
}
