import { NextResponse } from "next/server";

import { emailFromToken } from "@/lib/email/unsubscribe";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * The machine end of unsubscribing.
 *
 * Gmail and Yahoo POST here the moment a reader taps the "Unsubscribe"
 * chip next to our name — no page, no click-through, and they expect a 2xx
 * quickly. RFC 8058 requires the request to be honoured within 48 hours;
 * this honours it immediately.
 *
 * Anything other than a valid token still answers 200. A mail provider
 * retrying against an error is noise, and telling an unauthenticated
 * caller which addresses exist would be a lookup oracle.
 */
async function suppress(token: string | null): Promise<void> {
  const email = emailFromToken(token);
  if (!email) return;

  try {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from("email_unsubscribes")
      .upsert({ email, reason: "user" }, { onConflict: "email" });
    if (error) console.error("failed to record an unsubscribe:", error);
  } catch (err) {
    console.error("unsubscribe write failed:", err);
  }
}

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  await suppress(token);
  return new NextResponse(null, { status: 200 });
}

/**
 * Some clients follow the List-Unsubscribe URL with a GET instead. Honour
 * it the same way, then hand the reader the page that confirms it.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  await suppress(token);
  return NextResponse.redirect(
    new URL(`/unsubscribe?token=${token ?? ""}&done=1`, request.url),
    303
  );
}
