"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireConsole } from "@/lib/console/dal";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * The four things the desk can do about held money, and the two about a
 * BVN.
 *
 * Every one of them goes through a SECURITY DEFINER function rather
 * than a table write. The status of a review decides whether somebody's
 * money moves, and the functions are where the rules about that live:
 * clearing only applies to a hold that is still holding, marking a
 * refund only applies to one that was asked for, and each of them
 * notifies the person whose money it is. A bare update from here would
 * be able to skip all three.
 */

function operator(): string {
  return process.env.CONSOLE_EMAIL ?? "console";
}

export type HoldState = { error: string | null; done: string | null };

const askSchema = z.object({
  reviewId: z.string().uuid(),
  body: z
    .string()
    .trim()
    .min(5, "Ask something the person can actually answer.")
    .max(4000),
});

/** Ask the depositor where the money came from. */
export async function askDepositReview(
  _prev: HoldState,
  formData: FormData
): Promise<HoldState> {
  await requireConsole();

  const parsed = askSchema.safeParse({
    reviewId: formData.get("reviewId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Write a question.", done: null };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.rpc("ask_deposit_review", {
    p_review_id: parsed.data.reviewId,
    p_operator: operator(),
    p_body: parsed.data.body,
  });
  if (error) return { error: error.message, done: null };

  revalidatePath("/console/holds");
  return { error: null, done: "Asked. They get a push and an in-app card." };
}

const clearSchema = z.object({
  reviewId: z.string().uuid(),
  resolution: z.string().trim().max(1000).optional(),
});

/**
 * Satisfied: the money becomes ordinary money.
 *
 * The resolution is shown to the user verbatim, so it is written for
 * them and not for the file. It is optional because the common case is
 * a hold that never needed a conversation, and forcing a sentence there
 * just produces ten thousand rows reading "ok".
 */
export async function clearDepositReview(
  _prev: HoldState,
  formData: FormData
): Promise<HoldState> {
  await requireConsole();

  const parsed = clearSchema.safeParse({
    reviewId: formData.get("reviewId"),
    resolution: formData.get("resolution") || undefined,
  });
  if (!parsed.success) {
    return { error: "That note is too long.", done: null };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.rpc("clear_deposit_review", {
    p_review_id: parsed.data.reviewId,
    p_operator: operator(),
    p_resolution: parsed.data.resolution ?? null,
  });
  if (error) {
    return {
      error:
        error.message.includes("review_not_open")
          ? "That hold is not open any more — it was cleared, or a refund has already been asked for."
          : error.message,
      done: null,
    };
  }

  revalidatePath("/console/holds");
  return { error: null, done: "Cleared. The money is available to them now." };
}

const refundedSchema = z.object({
  reviewId: z.string().uuid(),
  refundReference: z
    .string()
    .trim()
    .min(3, "Paste the reference from the provider dashboard.")
    .max(120),
});

/**
 * Recorded AFTER the transfer has actually been made by hand.
 *
 * This does not move any money — it cannot, the refund goes out of the
 * payment provider's own dashboard to the account the deposit came
 * from. The wallet was debited when the user asked. All this does is
 * close the loop and tell them it has been sent, which is why it wants
 * the provider's reference: without it, nothing ties our record of the
 * refund to theirs.
 */
export async function markDepositRefunded(
  _prev: HoldState,
  formData: FormData
): Promise<HoldState> {
  await requireConsole();

  const parsed = refundedSchema.safeParse({
    reviewId: formData.get("reviewId"),
    refundReference: formData.get("refundReference"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Add the provider reference.",
      done: null,
    };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.rpc("mark_deposit_refunded", {
    p_review_id: parsed.data.reviewId,
    p_operator: operator(),
    p_refund_reference: parsed.data.refundReference,
  });
  if (error) {
    return {
      error: error.message.includes("review_not_refundable")
        ? "No refund has been asked for on that hold."
        : error.message,
      done: null,
    };
  }

  revalidatePath("/console/holds");
  return { error: null, done: "Recorded. They've been told it's on its way." };
}

const flagSchema = z.object({
  reference: z
    .string()
    .trim()
    .regex(/^SYD-[A-Z0-9]{10}$/i, "That is not a SYD- transaction reference."),
  note: z
    .string()
    .trim()
    .min(5, "Say why, in a sentence the person will read.")
    .max(1000),
});

/**
 * Freezing a credit by hand.
 *
 * Any credit, not only a deposit: escrow can pay out the proceeds of a
 * fake job, and a control that only works on card payments is not a
 * control. Debits are refused by the function — money that has already
 * gone cannot be held.
 *
 * Worth knowing before using it: if the money has already been spent,
 * the account can spend nothing further until this is settled. That is
 * the intended behaviour of a freeze, not a bug, but it is a heavier
 * action than it looks.
 */
export async function flagTransaction(
  _prev: HoldState,
  formData: FormData
): Promise<HoldState> {
  await requireConsole();

  const parsed = flagSchema.safeParse({
    reference: formData.get("reference"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the reference and the note.",
      done: null,
    };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.rpc("flag_transaction", {
    p_reference: parsed.data.reference.toUpperCase(),
    p_operator: operator(),
    p_note: parsed.data.note,
  });
  if (error) {
    return {
      error: error.message.includes("unknown_reference")
        ? "No transaction with that reference."
        : error.message.includes("not_a_credit")
          ? "That is money leaving, not money arriving — there is nothing left to hold."
          : error.message,
      done: null,
    };
  }

  revalidatePath("/console/holds");
  return { error: null, done: "Held. They've been told, and it can't be spent." };
}

const bvnRequestSchema = z.object({
  profileId: z.string().uuid(),
  reason: z
    .string()
    .trim()
    .min(10, "Say why. They read this sentence, so write it for them.")
    .max(500),
});

/**
 * Asking one person for their BVN.
 *
 * They withdraw nothing until they have verified. The reason is shown
 * to them verbatim, which is deliberate: a demand for a bank document
 * with no stated reason is how a platform teaches its users to fall for
 * phishing.
 */
export async function requestBvn(
  _prev: HoldState,
  formData: FormData
): Promise<HoldState> {
  await requireConsole();

  const parsed = bvnRequestSchema.safeParse({
    profileId: formData.get("profileId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Pick an account and give a reason.",
      done: null,
    };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.rpc("request_bvn", {
    p_profile_id: parsed.data.profileId,
    p_requested_by: operator(),
    p_reason: parsed.data.reason,
  });
  if (error) return { error: error.message, done: null };

  revalidatePath("/console/identity");
  return {
    error: null,
    done: "Asked. They can't withdraw until it's verified.",
  };
}

const withdrawRequestSchema = z.object({ profileId: z.string().uuid() });

/** Changed our mind: they withdraw normally again. */
export async function withdrawBvnRequest(
  _prev: HoldState,
  formData: FormData
): Promise<HoldState> {
  await requireConsole();

  const parsed = withdrawRequestSchema.safeParse({
    profileId: formData.get("profileId"),
  });
  if (!parsed.success) return { error: "Pick an account.", done: null };

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.rpc("withdraw_bvn_request", {
    p_profile_id: parsed.data.profileId,
  });
  if (error) return { error: error.message, done: null };

  revalidatePath("/console/identity");
  return { error: null, done: "Withdrawn. They can withdraw again." };
}
