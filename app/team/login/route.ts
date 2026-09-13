import { NextResponse } from "next/server";

import { createTeamSession } from "@/lib/team/session";
import { authenticateMember } from "@/lib/team/data";
import { normalizePhone } from "@/lib/team/phone";

export const dynamic = "force-dynamic";

/**
 * Plain POST login, for the same reason the console's is one: it avoids
 * Server Action IDs going stale across a deploy, and avoids action request
 * bodies that browser extensions sometimes mangle. This is the page people
 * land on from a phone with whatever is installed on it.
 */
export async function POST(request: Request) {
  const formData = await request.formData();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");

  const member =
    phone.ok && password
      ? await authenticateMember(phone.phone, password)
      : null;

  if (!member) {
    // Same wait and same message whether the number is unknown, the
    // password is wrong, or the account is suspended.
    await new Promise((resolve) => setTimeout(resolve, 700));
    return NextResponse.redirect(
      new URL("/team?error=invalid", request.url),
      303
    );
  }

  try {
    await createTeamSession(member.id);
  } catch (err) {
    console.error("member login session error:", err);
    return NextResponse.redirect(
      new URL("/team?error=config", request.url),
      303
    );
  }

  return NextResponse.redirect(new URL("/team/dashboard", request.url), 303);
}
