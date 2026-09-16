"use server";

import { emailFromToken } from "@/lib/email/unsubscribe";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * The 6-digit email verification actions used to sit here, wrapping
 * lib/email/verification.ts for the survey's email step. The survey is
 * gone, so the wrappers are too — an exported server action is a live
 * POST endpoint, and one that sends mail to any address handed to it
 * should not outlive the form it was written for.
 *
 * The library underneath is untouched and still used: `isEmailVerified`
 * gates the waitlist signup.
 */

export type SubscriptionResult = { ok: true } | { ok: false; error: string };

/**
 * Unsubscribe and resubscribe, driven from the page a reader lands on.
 *
 * The signed token is the only credential — there is no session here, and
 * the reader must never be asked to prove who they are to stop hearing
 * from us. A token that doesn't verify does nothing at all.
 */
export async function unsubscribe(token: string): Promise<SubscriptionResult> {
  const email = emailFromToken(token);
  if (!email) {
    return { ok: false, error: "This link has expired. Reply to any of our emails and we'll remove you." };
  }

  try {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from("email_unsubscribes")
      .upsert({ email, reason: "user" }, { onConflict: "email" });

    if (error) {
      console.error("failed to unsubscribe:", error);
      return { ok: false, error: "Something went wrong. Please try again." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export async function resubscribe(token: string): Promise<SubscriptionResult> {
  const email = emailFromToken(token);
  if (!email) return { ok: false, error: "This link has expired." };

  try {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from("email_unsubscribes")
      .delete()
      .eq("email", email);

    if (error) {
      console.error("failed to resubscribe:", error);
      return { ok: false, error: "Something went wrong. Please try again." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
