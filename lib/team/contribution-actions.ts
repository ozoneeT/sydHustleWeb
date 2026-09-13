"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireMember } from "@/lib/team/dal";
import {
  MAX_MEDIA_PER_CONTRIBUTION,
  MAX_MEDIA_BYTES,
  isAllowedMediaType,
} from "@/lib/team/media";
import { r2Config, deleteObjects, TEAM_PREFIX } from "@/lib/team/r2";
import { ledgerToday } from "@/lib/team/format";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * What a member can do to their own ledger: add to it, and withdraw
 * something they haven't been reviewed on yet.
 *
 * Nothing here can approve anything. A posted contribution is a claim —
 * `status` is not an input, `credited_hours` is not an input, and both
 * belong to the console. Every write is scoped by `member_id` taken
 * from the session rather than the form, so the worst a forged request can
 * do is edit its own sender's rows.
 */

export type ContributionState = { error: string | null; posted: boolean };

/** Written by the browser after the file is already in the bucket. The
 * path is checked against the session's own prefix below, so this is a
 * claim about a file, not permission to attach it. */
const mediaSchema = z.object({
  path: z.string().trim().min(1).max(400),
  mime: z.string().trim().min(1).max(120),
  size: z.number().int().nonnegative(),
});

const schema = z.object({
  title: z
    .string()
    .trim()
    .min(4, "Give it a short title — what did you do?")
    .max(140),
  // Optional — a title and a date is a real entry. Recommended in the
  // form, because it is what lets a reviewer say yes without asking.
  body: z.string().trim().max(8000),
  category: z.string().trim().min(1).max(40),
  occurredOn: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick the day you did the work."),
  hours: z
    .union([z.literal(""), z.coerce.number().min(0).max(999)])
    .optional(),
  media: z.array(mediaSchema).max(MAX_MEDIA_PER_CONTRIBUTION),
});

function parseMedia(raw: FormDataEntryValue | null): unknown {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function postContribution(
  _prev: ContributionState,
  formData: FormData
): Promise<ContributionState> {
  const member = await requireMember();

  const media = parseMedia(formData.get("media"));
  if (media === null) {
    return { error: "Something went wrong with the attachments.", posted: false };
  }

  const parsed = schema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    category: formData.get("category"),
    occurredOn: formData.get("occurredOn"),
    hours: formData.get("hours") ?? "",
    media,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the form.",
      posted: false,
    };
  }

  // The day the work happened can't be in the future. Tomorrow's
  // contribution hasn't happened yet, and the date is what a payout would
  // eventually be ordered by.
  if (parsed.data.occurredOn > ledgerToday()) {
    return { error: "That date is in the future.", posted: false };
  }

  // Every key must sit under this member's own prefix. The upload route
  // only ever issues keys shaped that way, so anything else here is a
  // hand-made request trying to staple someone else's file — or a file
  // nobody uploaded — onto a claim.
  const prefix = `${TEAM_PREFIX}/${member.id}/`;
  for (const file of parsed.data.media) {
    if (!file.path.startsWith(prefix) || file.path.includes("..")) {
      return { error: "Those attachments aren't yours.", posted: false };
    }
    if (!isAllowedMediaType(file.mime) || file.size > MAX_MEDIA_BYTES) {
      return { error: "One of those files isn't allowed.", posted: false };
    }
  }

  const supabase = createServerSupabaseClient();
  const hours =
    parsed.data.hours === "" || parsed.data.hours === undefined
      ? null
      : parsed.data.hours;

  const { data: created, error } = await supabase
    .from("team_contributions")
    .insert({
      member_id: member.id,
      title: parsed.data.title,
      body: parsed.data.body || null,
      category: parsed.data.category,
      occurred_on: parsed.data.occurredOn,
      hours,
    })
    .select("id")
    .single();

  if (error || !created) {
    console.error("failed to post a contribution:", error);
    return { error: "Couldn't save that. Please try again.", posted: false };
  }

  if (parsed.data.media.length > 0) {
    const { error: mediaError } = await supabase
      .from("team_contribution_media")
      .insert(
        parsed.data.media.map((file) => ({
          contribution_id: created.id,
          storage_path: file.path,
          mime_type: file.mime,
          size_bytes: file.size,
        }))
      );

    // The write-up is the part that matters and it is already saved, so a
    // failure here is reported without throwing the text away.
    if (mediaError) {
      console.error("failed to attach contribution media:", mediaError);
      return {
        error:
          "Saved your write-up, but the attachments didn't stick. Add them to a new entry.",
        posted: true,
      };
    }
  }

  revalidatePath("/team/dashboard");
  return { error: null, posted: true };
}

export type WithdrawState = { error: string | null };

/**
 * Taking back a claim.
 *
 * Only while it is still pending: once someone has approved or rejected
 * it, it is a decision on the record and not the claimant's to delete.
 */
export async function withdrawContribution(
  _prev: WithdrawState,
  formData: FormData
): Promise<WithdrawState> {
  const member = await requireMember();

  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return { error: "Couldn't find that entry." };

  const supabase = createServerSupabaseClient();

  // Read the attachments before the row goes, because the cascade takes
  // the media rows with it and the bucket would keep the files forever
  // with nothing left pointing at them.
  const { data: attached } = await supabase
    .from("team_contribution_media")
    .select("storage_path")
    .eq("contribution_id", id.data);

  const { data, error } = await supabase
    .from("team_contributions")
    .delete()
    .eq("id", id.data)
    .eq("member_id", member.id)
    .eq("status", "pending")
    .select("id");

  if (error) {
    console.error("failed to withdraw a contribution:", error);
    return { error: "Couldn't remove that. Please try again." };
  }
  if (!data || data.length === 0) {
    return { error: "That one has already been reviewed, so it stays." };
  }

  // Only after the delete succeeded, so a claim that was not this
  // member's to remove never loses its evidence. A file left behind is
  // untidy, not broken — the claim it belonged to is already gone — so
  // `deleteObjects` reports its failures rather than raising them.
  const keys = (attached ?? []).map((row) => row.storage_path as string);
  const config = keys.length > 0 ? r2Config() : null;
  if (config) await deleteObjects(config, keys);

  revalidatePath("/team/dashboard");
  return { error: null };
}
