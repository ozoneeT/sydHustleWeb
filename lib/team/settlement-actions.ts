"use server";

import { revalidatePath } from "next/cache";

import { requireMember } from "@/lib/team/dal";
import { isSettlementOpen } from "@/lib/team/settings";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { describeSupabaseError } from "@/lib/supabase/errors";

/**
 * Putting your hand up to be paid.
 *
 * The check here is not a duplicate of the one the dashboard already did.
 * That one chose what to render; this one decides. A server action is a
 * POST endpoint reachable without ever loading the page, so "the button
 * was disabled" protects nobody.
 *
 * Asking twice is not an error and does not make two debts — it moves the
 * timestamp, which is what "still waiting, asked most recently on…" looks
 * like to whoever is working through the list.
 */

export type SettlementState = { error: string | null; requested: boolean };

export async function requestSettlement(): Promise<SettlementState> {
  const member = await requireMember();

  if (!(await isSettlementOpen())) {
    return {
      error: "Settlement isn't open yet.",
      requested: false,
    };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("team_members")
    .update({ settlement_requested_at: new Date().toISOString() })
    .eq("id", member.id);

  if (error) {
    console.error("failed to record a settlement request:", describeSupabaseError(error));
    return { error: "Couldn't send that. Please try again.", requested: false };
  }

  revalidatePath("/team/dashboard");
  revalidatePath("/console/team");
  return { error: null, requested: true };
}
