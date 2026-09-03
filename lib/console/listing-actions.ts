"use server";

import { revalidatePath } from "next/cache";

import { requireConsole } from "@/lib/console/dal";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Acting on one published Skill card.
 *
 * All three are the same shape on purpose — hide it, say why, tell the
 * owner — and the database does the telling, because a listing that
 * quietly stops appearing while its owner still sees it in their own
 * list is the worst possible version of this.
 *
 * "Delete" here is a takedown, not a DELETE. The row stays, `removed_at`
 * is set, and every feed, rail, search and booking path already filters
 * on that. Keeping the row is what makes the decision reviewable later
 * and reversible today; erasing it would destroy the evidence for the
 * dispute it usually causes.
 */

export type ListingActionState = { error: string | null; message: string | null };

function explain(message: string): string {
  if (message.includes("question_required")) {
    return "Ask an actual question — at least ten characters. This text is the only thing telling the owner how to get their Skill back, so “more info” is not something anybody can answer.";
  }
  if (message.includes("reason_required")) {
    return "Give a reason of at least ten characters. The owner is told it, and so is whoever reviews this later.";
  }
  if (message.includes("unknown_listing")) {
    return "That listing no longer exists. Reload the page.";
  }
  return message;
}

function refresh() {
  revalidatePath("/console/listings");
}

export async function suspendListing(
  _prev: ListingActionState,
  formData: FormData
): Promise<ListingActionState> {
  await requireConsole();

  const id = String(formData.get("id") ?? "");
  const question = String(formData.get("question") ?? "");
  if (!id) return { error: "Nothing to suspend.", message: null };

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.rpc("console_suspend_listing", {
    p_id: id,
    p_question: question,
  });
  if (error) return { error: explain(error.message), message: null };

  refresh();
  return {
    error: null,
    message: "Hidden, and the owner has been asked. It moves to Needs info.",
  };
}

export async function removeListing(
  _prev: ListingActionState,
  formData: FormData
): Promise<ListingActionState> {
  await requireConsole();

  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "");
  if (!id) return { error: "Nothing to remove.", message: null };

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.rpc("console_remove_listing", {
    p_id: id,
    p_reason: reason,
  });
  if (error) return { error: explain(error.message), message: null };

  refresh();
  return { error: null, message: "Taken down, and the owner has been told." };
}

export async function restoreListing(
  _prev: ListingActionState,
  formData: FormData
): Promise<ListingActionState> {
  await requireConsole();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Nothing to restore.", message: null };

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.rpc("console_restore_listing", { p_id: id });
  if (error) return { error: explain(error.message), message: null };

  refresh();
  return { error: null, message: "Live again, and the owner has been told." };
}
