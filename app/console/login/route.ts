import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { createConsoleSession } from "@/lib/console/session";
import { authenticateStaff } from "@/lib/console/staff";

export const dynamic = "force-dynamic";

/** Constant-time equality over hashes, so length differences leak nothing. */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

function consoleUrl(request: Request, path: string) {
  // Prefer the public www host the browser is on (apex 308s to www).
  return new URL(path, request.url);
}

/**
 * Plain POST login — avoids Next.js Server Action IDs (skew) and fragile
 * action request bodies that browser extensions often break.
 *
 * Two kinds of account arrive here. The superadmin is CONSOLE_EMAIL /
 * CONSOLE_PASSWORD from the environment and gets a session with no staff
 * id, which means "everything". Everyone else is a row in console_staff
 * whose roles decide what they can open.
 *
 * The environment check runs first and, on a match, never touches the
 * database — so a broken or unreachable staff table can't lock the
 * superadmin out of the console that fixes it.
 */
export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const expectedEmail = process.env.CONSOLE_EMAIL;
  const expectedPassword = process.env.CONSOLE_PASSWORD;
  if (!expectedEmail || !expectedPassword) {
    return NextResponse.redirect(
      consoleUrl(request, "/console?error=config"),
      303
    );
  }

  const isSuperAdmin =
    safeEqual(email, expectedEmail.toLowerCase()) &&
    safeEqual(password, expectedPassword);

  if (isSuperAdmin) {
    try {
      await createConsoleSession();
    } catch (err) {
      console.error("console login session error:", err);
      return NextResponse.redirect(consoleUrl(request, "/console?error=config"), 303);
    }
    return NextResponse.redirect(consoleUrl(request, "/console/overview"), 303);
  }

  const staff = email && password ? await authenticateStaff(email, password) : null;

  if (!staff) {
    // Same delay and same message whether the address is unknown, the
    // password is wrong, or the invitation was never accepted — the login
    // form must not become a way to find out who works here.
    await new Promise((resolve) => setTimeout(resolve, 800));
    return NextResponse.redirect(consoleUrl(request, "/console?error=invalid"), 303);
  }

  try {
    await createConsoleSession({
      staffId: staff.id,
      permissions: staff.permissions,
    });
  } catch (err) {
    console.error("staff login session error:", err);
    return NextResponse.redirect(consoleUrl(request, "/console?error=config"), 303);
  }

  // Straight to somewhere they can actually open. Sending everyone to
  // /console/overview would bounce a member of staff without it into the
  // denied page on the first screen they ever see.
  const landing = staff.permissions[0]
    ? `/console/${staff.permissions[0]}`
    : "/console/denied";

  return NextResponse.redirect(consoleUrl(request, landing), 303);
}
