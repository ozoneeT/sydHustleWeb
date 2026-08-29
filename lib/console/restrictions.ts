"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireConsole } from "@/lib/console/dal";
import { FEATURES, type FeatureKey, type FeatureRestriction } from "@/lib/console/features";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Taking one feature away, instead of the whole account.
 *
 * Suspension is a blunt instrument and it was the only one: somebody
 * reported for pushing a deal off-platform in chat had to either keep
 * messaging while it was looked at, or lose their wallet, their in-flight
 * Hustles and their ability to take a call from the person they were
 * meeting. Neither is proportionate to most of what arrives at this desk.
 *
 * The database enforces these at the door each feature is actually used
 * through, on the actor named in the row rather than on `auth.uid()` — see
 * 20260829130000_feature_restrictions in the app repo. Nothing here has to
 * be trusted; this is only the way in.
 */

export type RestrictionState = { error: string | null; done: boolean };

/** Everything ever done to this account, newest first. Expired rows are
 * included on purpose: "we already paused this once last month" is context
 * the next decision needs, and hiding it makes every case look like a
 * first offence. */
export async function listRestrictions(
  profileId: string
): Promise<FeatureRestriction[]> {
  await requireConsole();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc("feature_restrictions_for", {
    p_profile: profileId,
  });
  if (error) throw new Error(error.message);

  const now = Date.now();
  return ((data ?? []) as Omit<FeatureRestriction, "active">[]).map((row) => ({
    ...row,
    active:
      row.restricted_until === null ||
      new Date(row.restricted_until).getTime() > now,
  }));
}

const schema = z.object({
  profileId: z.string().uuid(),
  feature: z.enum(FEATURES.map((f) => f.key) as [FeatureKey, ...FeatureKey[]]),
  restricted: z.enum(["on", "off"]),
  // Matches the RPC's own floor. Not sent to the user — this is the desk's
  // note about a decision, and the next moderator is the reader.
  reason: z.string().trim().min(10).max(1000).optional(),
  days: z.coerce.number().int().min(1).max(365).optional(),
});

const RPC_ERRORS: Record<string, string> = {
  reason_required:
    "Write a reason of at least 10 characters — the next moderator reads it.",
  feature_restrictions_feature_check:
    "That isn't a feature this app knows how to restrict.",
};

export async function setFeatureRestriction(
  _prev: RestrictionState,
  formData: FormData
): Promise<RestrictionState> {
  await requireConsole();

  const parsed = schema.safeParse({
    profileId: formData.get("profileId"),
    feature: formData.get("feature"),
    restricted: formData.get("restricted"),
    reason: formData.get("reason") || undefined,
    days: formData.get("days") || undefined,
  });
  if (!parsed.success) {
    return {
      error:
        "Write a reason of at least 10 characters — the next moderator reads it.",
      done: false,
    };
  }

  const { profileId, feature, restricted, reason, days } = parsed.data;
  const on = restricted === "on";

  if (on && !reason) {
    return {
      error:
        "Write a reason of at least 10 characters — the next moderator reads it.",
      done: false,
    };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.rpc("set_feature_restriction", {
    p_profile: profileId,
    p_feature: feature,
    p_restricted: on,
    // No days means indefinite, which is a deliberate option rather than an
    // oversight: some restrictions should stand until a human looks again.
    p_until: on && days ? new Date(Date.now() + days * 86_400_000).toISOString() : null,
    p_reason: on ? reason : null,
    // The console signs in with one shared scope token (see
    // lib/console/session), so there is no individual moderator to record.
    // `created_by` is nullable for exactly this reason; when per-moderator
    // logins arrive, this is the line that changes.
    p_actor: null,
  });

  if (error) {
    const code = Object.keys(RPC_ERRORS).find((key) =>
      error.message.includes(key)
    );
    return { error: code ? RPC_ERRORS[code]! : error.message, done: false };
  }

  revalidatePath(`/console/users/${profileId}`);
  return { error: null, done: true };
}

export type ConsoleUserProfile = {
  id: string;
  full_name: string | null;
  school: string | null;
  created_at: string;
  suspended_until: string | null;
  terminated_at: string | null;
  /** Whole-account sanction in force right now. Computed here for the same
   * reason `active` is: a render may not read the clock. */
  suspended: boolean;
};

/** The header of the user page. Separate from `listUsers` because that one
 * is a list query with wallet joins and an auth email sweep; this is one
 * row and the moderation state on it. */
export async function getConsoleUser(
  profileId: string
): Promise<ConsoleUserProfile | null> {
  await requireConsole();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, school, created_at, suspended_until, terminated_at")
    .eq("id", profileId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    ...data,
    suspended: Boolean(
      data.terminated_at ||
        (data.suspended_until &&
          new Date(data.suspended_until).getTime() > Date.now())
    ),
  };
}
