"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireConsole } from "@/lib/console/dal";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type BoostActionState = { error: string | null; done: boolean };

const rerankSchema = z.object({
  id: z.string().uuid(),
  rank: z.coerce.number().int().min(1).max(999),
});

const cancelSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().trim().max(300).optional(),
});

/**
 * Change carousel order.
 *
 * There is no approve/decline any more: hustleBoost is a subscription, and
 * withholding what someone has already paid for is a refund conversation,
 * not a review queue. Ordering is the decision that is actually ours.
 */
export async function rerankBoost(
  _prev: BoostActionState,
  formData: FormData
): Promise<BoostActionState> {
  await requireConsole();

  const parsed = rerankSchema.safeParse({
    id: formData.get("id"),
    rank: formData.get("rank"),
  });
  if (!parsed.success) {
    return { error: "Rank must be between 1 and 999.", done: false };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.rpc("rerank_skill_boost", {
    p_boost_id: parsed.data.id,
    p_rank: parsed.data.rank,
  });
  if (error) return { error: error.message, done: false };

  revalidatePath("/console/featured");
  return { error: null, done: true };
}

/**
 * Pull a live boost — abuse, or a listing taken down.
 *
 * Does not refund: the money went to Apple or Google and only they can
 * return it. Cancel the subscription on the store side too, or it renews
 * into a boost that has been pulled.
 */
export async function cancelBoost(
  _prev: BoostActionState,
  formData: FormData
): Promise<BoostActionState> {
  await requireConsole();

  const parsed = cancelSchema.safeParse({
    id: formData.get("id"),
    reason: formData.get("reason") ?? undefined,
  });
  if (!parsed.success) {
    return { error: "That boost isn't valid.", done: false };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.rpc("cancel_skill_boost", {
    p_boost_id: parsed.data.id,
    p_reason: parsed.data.reason ?? null,
  });
  if (error) {
    return {
      error: error.message.includes("not_live")
        ? "That boost isn't running."
        : error.message,
      done: false,
    };
  }

  revalidatePath("/console/featured");
  return { error: null, done: true };
}
