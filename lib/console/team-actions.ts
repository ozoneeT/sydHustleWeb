"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireConsole, type ConsoleActor } from "@/lib/console/dal";
import { formatPhone, normalizePhone } from "@/lib/team/phone";
import { memberLabel } from "@/lib/team/format";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * The console half of the team ledger: who is allowed in, and which
 * of their claims count.
 *
 * Every action here re-checks its own tab through `requireConsole`. These
 * are POST endpoints once they reach the browser, so rendering the screen
 * behind a permission is not what protects them.
 *
 * `team` and `contributions` are separate permissions because they
 * are separate jobs: adding someone to the roster decides who can post at
 * all, while approving a claim decides what a share of the company will
 * eventually be divided by. Someone can reasonably be trusted with one and
 * not the other.
 */

export type TeamAdminState = { error: string | null; done: string | null };

const EMPTY: TeamAdminState = { error: null, done: null };

function reviewerLabel(actor: ConsoleActor): string {
  return actor.kind === "super" ? "Superadmin" : actor.name;
}

function refreshTeamScreens() {
  revalidatePath("/console/team");
  revalidatePath("/console/contributions");
}

const addSchema = z.object({
  phone: z.string().trim().min(1),
  note: z.string().trim().max(200).optional(),
});

/**
 * Putting a number on the roster.
 *
 * This is the whole gate. Nobody can sign up as a member until their
 * number is a row here, so this form is the only place new people are let
 * in — deliberately manual, deliberately one at a time.
 *
 * A NUMBER IS ALL IT TAKES, and all it asks for. Whoever adds someone
 * usually has a phone number passed on in a chat and no agreed spelling of
 * the name behind it; the member fills that in themselves at signup, where
 * it is theirs and correct. The optional note is for recognising the row
 * in the meantime, and is never shown to them.
 */
export async function addTeamMember(
  _prev: TeamAdminState,
  formData: FormData
): Promise<TeamAdminState> {
  await requireConsole("team");

  const parsed = addSchema.safeParse({
    phone: formData.get("phone"),
    note: formData.get("note") ?? undefined,
  });
  if (!parsed.success) {
    return { ...EMPTY, error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!phone.ok) return { ...EMPTY, error: phone.error };

  const supabase = createServerSupabaseClient();
  // No name: it stays null until they sign up and give one.
  const { error } = await supabase.from("team_members").insert({
    phone: phone.phone,
    note: parsed.data.note || null,
  });

  if (error) {
    // 23505 is Postgres' unique violation — the number is already on the
    // roster, which is worth saying plainly rather than as "failed".
    if (error.code === "23505") {
      return { ...EMPTY, error: "That number is already on the list." };
    }
    console.error("failed to add a member:", error);
    return { ...EMPTY, error: "Couldn't add that number. Try again." };
  }

  refreshTeamScreens();
  return {
    error: null,
    done: `${formatPhone(phone.phone)} can now sign up.`,
  };
}

const statusSchema = z.object({
  memberId: z.string().uuid(),
  status: z.enum(["active", "suspended"]),
});

/**
 * Suspending someone, or letting them back in.
 *
 * A suspended member cannot sign in and cannot post, but everything
 * they already contributed stays exactly where it is. Access and credit
 * are different questions, and falling out with someone is not a reason to
 * erase what they built.
 */
export async function setMemberStatus(
  _prev: TeamAdminState,
  formData: FormData
): Promise<TeamAdminState> {
  await requireConsole("team");

  const parsed = statusSchema.safeParse({
    memberId: formData.get("memberId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { ...EMPTY, error: "Couldn't find that member." };

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("team_members")
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.memberId)
    // Someone who has never signed up is `invited`, and reinstating them
    // must not hand them an active account with no password on it.
    .not("password_hash", "is", null)
    .select("name, phone");

  if (error) {
    console.error("failed to change a member's status:", error);
    return { ...EMPTY, error: "Couldn't change that. Try again." };
  }
  if (!data || data.length === 0) {
    return { ...EMPTY, error: "They haven't signed up yet, so there's nothing to suspend." };
  }

  refreshTeamScreens();
  return {
    error: null,
    done:
      parsed.data.status === "suspended"
        ? `${memberLabel(data[0])} can no longer sign in.`
        : `${memberLabel(data[0])} is back in.`,
  };
}

const idSchema = z.object({ memberId: z.string().uuid() });

/**
 * Forgotten password.
 *
 * There is no email address on a member and no SMS sender wired up, so
 * a reset link has nowhere to go. Instead the account goes back to being a
 * roster entry: the password is cleared and they sign up again with the
 * same number. Whoever does this has to actually know the person is asking,
 * which for a team this size is the honest version of identity
 * verification.
 */
export async function resetMemberPassword(
  _prev: TeamAdminState,
  formData: FormData
): Promise<TeamAdminState> {
  await requireConsole("team");

  const parsed = idSchema.safeParse({ memberId: formData.get("memberId") });
  if (!parsed.success) return { ...EMPTY, error: "Couldn't find that member." };

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("team_members")
    .update({
      password_hash: null,
      status: "invited",
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.memberId)
    // The name is deliberately left alone: it is still the same person,
    // and signup will overwrite it with whatever they type anyway.
    .select("name, phone");

  if (error || !data || data.length === 0) {
    console.error("failed to reset a member password:", error);
    return { ...EMPTY, error: "Couldn't reset that. Try again." };
  }

  refreshTeamScreens();
  return {
    error: null,
    done: `${memberLabel(data[0])} can sign up again with the same number.`,
  };
}

/**
 * Removing a number from the roster.
 *
 * Only for someone who has contributed nothing — a wrong number, a person
 * who never started. Once there are claims against a name, deleting the
 * row would take the ledger with it, so the answer there is suspension.
 */
export async function removeMember(
  _prev: TeamAdminState,
  formData: FormData
): Promise<TeamAdminState> {
  await requireConsole("team");

  const parsed = idSchema.safeParse({ memberId: formData.get("memberId") });
  if (!parsed.success) return { ...EMPTY, error: "Couldn't find that member." };

  const supabase = createServerSupabaseClient();
  const { count } = await supabase
    .from("team_contributions")
    .select("id", { count: "exact", head: true })
    .eq("member_id", parsed.data.memberId);

  if ((count ?? 0) > 0) {
    return {
      ...EMPTY,
      error:
        "They've already posted work. Suspend them instead — deleting would erase the record of it.",
    };
  }

  const { data, error } = await supabase
    .from("team_members")
    .delete()
    .eq("id", parsed.data.memberId)
    .select("name, phone");

  if (error || !data || data.length === 0) {
    console.error("failed to remove a member:", error);
    return { ...EMPTY, error: "Couldn't remove that. Try again." };
  }

  refreshTeamScreens();
  return { error: null, done: `${memberLabel(data[0])} is off the list.` };
}

const reviewSchema = z
  .object({
    contributionId: z.string().uuid(),
    decision: z.enum(["approved", "rejected"]),
    creditedHours: z.union([z.literal(""), z.coerce.number().min(0).max(999)]),
    note: z.string().trim().max(1000).optional(),
  })
  .refine(
    (data) => data.decision === "approved" || (data.note ?? "").length > 0,
    {
      message: "Say why it's being turned down — they'll only see this note.",
      path: ["note"],
    }
  );

/**
 * Approving or turning down a claim.
 *
 * `credited_hours` is set here and only here. The member's own `hours`
 * stays untouched next to it, so if a reviewer credits four hours against
 * a claim of six, both numbers survive and the disagreement is visible
 * instead of silently resolved.
 *
 * A decision can be changed later — someone approves the wrong entry, or a
 * rejection turns out to have been a misunderstanding — so this is an
 * update rather than an insert-once. The reviewer and the time are
 * overwritten with whoever decided last, which is the fact that matters.
 */
export async function reviewContribution(
  _prev: TeamAdminState,
  formData: FormData
): Promise<TeamAdminState> {
  const actor = await requireConsole("contributions");

  const parsed = reviewSchema.safeParse({
    contributionId: formData.get("contributionId"),
    decision: formData.get("decision"),
    creditedHours: formData.get("creditedHours") ?? "",
    note: formData.get("note") ?? undefined,
  });
  if (!parsed.success) {
    return { ...EMPTY, error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const approved = parsed.data.decision === "approved";
  const credited =
    parsed.data.creditedHours === "" ? null : parsed.data.creditedHours;

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("team_contributions")
    .update({
      status: parsed.data.decision,
      // A rejected claim credits nothing, whatever was typed in the box.
      credited_hours: approved ? credited : null,
      review_note: parsed.data.note || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerLabel(actor),
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.contributionId)
    .select("title");

  if (error || !data || data.length === 0) {
    console.error("failed to review a contribution:", error);
    return { ...EMPTY, error: "Couldn't record that. Try again." };
  }

  refreshTeamScreens();
  return {
    error: null,
    done: approved
      ? `Approved “${data[0].title}”.`
      : `Turned down “${data[0].title}”.`,
  };
}
