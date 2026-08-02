import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { createConsoleSession } from "@/lib/console/session";

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

  const ok =
    safeEqual(email, expectedEmail.toLowerCase()) &&
    safeEqual(password, expectedPassword);

  if (!ok) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return NextResponse.redirect(
      consoleUrl(request, "/console?error=invalid"),
      303
    );
  }

  try {
    await createConsoleSession();
  } catch (err) {
    console.error("console login session error:", err);
    return NextResponse.redirect(
      consoleUrl(request, "/console?error=config"),
      303
    );
  }

  return NextResponse.redirect(consoleUrl(request, "/console/overview"), 303);
}
