import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { createSurveyListSession } from "@/lib/surveylist/session";

export const dynamic = "force-dynamic";

/** Constant-time equality over hashes, so length differences leak nothing. */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Plain POST login — same admin credentials as the console, no Server Action
 * IDs to skew across deployments.
 */
export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const expectedEmail = process.env.CONSOLE_EMAIL;
  const expectedPassword = process.env.CONSOLE_PASSWORD;
  if (!expectedEmail || !expectedPassword) {
    return NextResponse.redirect(
      new URL("/surveylist?error=config", request.url),
      303
    );
  }

  const ok =
    safeEqual(email, expectedEmail.toLowerCase()) &&
    safeEqual(password, expectedPassword);

  if (!ok) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return NextResponse.redirect(
      new URL("/surveylist?error=invalid", request.url),
      303
    );
  }

  try {
    await createSurveyListSession();
  } catch (err) {
    console.error("survey list login session error:", err);
    return NextResponse.redirect(
      new URL("/surveylist?error=config", request.url),
      303
    );
  }

  return NextResponse.redirect(new URL("/surveylist", request.url), 303);
}
