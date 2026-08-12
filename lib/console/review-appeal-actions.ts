"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireConsole } from "@/lib/console/dal";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ReviewAppealActionState = { error: string | null; done: boolean };

/**
 * The note is required, not optional, and that is deliberate.
 *
 * Both sides are told the outcome and the note is what they are told —
 * `uphold_review_appeal` sends it to the person whose review was
 * removed, and `reject_review_appeal` sends it to the appellant. A
 * decision delivered with no reason reads as arbitrary: the reviewer
 * assumes the removal was bought and says so publicly, and the appellant
 * files again through support. Ten words prevents both.
 */
const decisionSchema = z.object({
  id: z.string().uuid(),
  note: z.string().trim().min(10).max(500),
});

async function decide(
  rpc: "uphold_review_appeal" | "reject_review_appeal",
  formData: FormData
): Promise<ReviewAppealActionState> {
  await requireConsole();

  const parsed = decisionSchema.safeParse({
    id: formData.get("id"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return {
      error:
        "Write a reason of at least 10 characters — both people are sent it.",
      done: false,
    };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.rpc(rpc, {
    p_appeal_id: parsed.data.id,
    p_note: parsed.data.note,
  });

  if (error) {
    return {
      error: error.message.includes("not_pending")
        ? "That appeal has already been decided."
        : error.message,
      done: false,
    };
  }

  revalidatePath("/console/review-appeals");
  return { error: null, done: true };
}

/** Take the review down. Aggregates recompute server-side; the reviewer
 * is told, with this note as the reason. */
export async function upholdReviewAppeal(
  _prev: ReviewAppealActionState,
  formData: FormData
): Promise<ReviewAppealActionState> {
  return decide("uphold_review_appeal", formData);
}

/** The review stands. The appellant is told, and pointed at the public
 * reply, which is still open to them. */
export async function rejectReviewAppeal(
  _prev: ReviewAppealActionState,
  formData: FormData
): Promise<ReviewAppealActionState> {
  return decide("reject_review_appeal", formData);
}
