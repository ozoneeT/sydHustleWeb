"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { checkPasswordStrength, hashPassword } from "@/lib/console/password";
import { TEAM_MIN_PASSWORD_LENGTH } from "@/lib/team/password-rules";
import { createTeamSession } from "@/lib/team/session";
import { findMemberByPhone } from "@/lib/team/data";
import { normalizePhone } from "@/lib/team/phone";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Signing up as a member.
 *
 * Reachable with no session at all, which is what keeps it in its own file
 * away from everything that assumes one. The phone number is the whole
 * credential for getting in the door: if it is not already on the roster,
 * put there by hand in the console, there is nothing here to sign up to.
 *
 * This does tell an anonymous caller whether a given number is on the
 * roster, and that is accepted rather than overlooked. The alternative —
 * a generic "if that number is on the list you'll hear from us" — would
 * leave someone who mistyped their own number with no way to tell that
 * from not having been added yet, on the one screen where being stuck is
 * most likely to end with them giving up. The roster is a handful of
 * people's numbers, not a customer list, and a wrong guess still gets you
 * nothing without a password.
 */

export type SignupState = { error: string | null };

const schema = z
  .object({
    phone: z.string().trim().min(1),
    name: z.string().trim().min(2, "Tell us your name.").max(80),
    password: z.string(),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Those two passwords don't match.",
    path: ["confirm"],
  });

export async function signUpMember(
  _prev: SignupState,
  formData: FormData
): Promise<SignupState> {
  const parsed = schema.safeParse({
    phone: formData.get("phone"),
    name: formData.get("name"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!phone.ok) return { error: phone.error };

  // Lower than the console's floor, and asked for in writing — see
  // lib/team/password-rules.ts for why.
  const weak = checkPasswordStrength(
    parsed.data.password,
    TEAM_MIN_PASSWORD_LENGTH
  );
  if (weak) return { error: weak };

  const existing = await findMemberByPhone(phone.phone);

  if (!existing) {
    // Slowed down so this can't be used to walk through a range of
    // numbers at speed.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      error:
        "That number isn't on the team list. Ask whoever runs the team to add it, then try again.",
    };
  }

  if (existing.status === "suspended") {
    return {
      error: "That number can't sign up. Talk to whoever runs the team.",
    };
  }

  if (existing.hasPassword) {
    return {
      error: "You've already signed up with this number — sign in instead.",
    };
  }

  const supabase = createServerSupabaseClient();
  const { data: claimed, error } = await supabase
    .from("team_members")
    .update({
      name: parsed.data.name,
      password_hash: await hashPassword(parsed.data.password),
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id)
    // Only a roster entry that has never been claimed may be turned into an
    // account. Two people submitting this form for the same number at the
    // same time means the second one changes nothing.
    .eq("status", "invited")
    .is("password_hash", null)
    // Returned rather than discarded: matching nothing is not an error to
    // Postgres, so without this a lost race would report success and then
    // sign the loser in as the winner.
    .select("id");

  if (error) {
    console.error("failed to sign up a member:", error);
    return { error: "Something went wrong. Please try again." };
  }

  if (!claimed || claimed.length === 0) {
    return {
      error: "You've already signed up with this number — sign in instead.",
    };
  }

  // Straight in — asking someone to type the password they chose ten
  // seconds ago into a login form is friction with nothing to show for it.
  await createTeamSession(existing.id);
  redirect("/team/dashboard");
}
