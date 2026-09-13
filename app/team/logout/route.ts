import { NextResponse } from "next/server";

import { deleteTeamSession } from "@/lib/team/session";

export const dynamic = "force-dynamic";

/** Signing out on purpose, as opposed to being signed out — which is
 * /team/signed-out and says something different on arrival. */
export async function POST(request: Request) {
  await deleteTeamSession();
  return NextResponse.redirect(
    new URL("/team?signed_out=1", request.url),
    303
  );
}
