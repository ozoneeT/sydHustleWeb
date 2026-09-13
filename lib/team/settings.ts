import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { describeSupabaseError } from "@/lib/supabase/errors";

/**
 * The one switch that decides whether settlement is open.
 *
 * Read by the member's dashboard to decide what the button looks like, and
 * again by the action behind it before anything is recorded. Those are two
 * different jobs: the first is courtesy, the second is the rule. A button
 * rendered disabled is still a POST anyone can send by hand.
 *
 * Failing closed is the point of the `?? false`. If this read fails — the
 * row is missing, the table isn't migrated yet, Supabase is having a
 * minute — settlement stays shut. The cost of that is a button that says
 * "not yet" on a day it should have said yes; the cost of the other
 * direction is telling people they can ask for money when they can't.
 */
export async function isSettlementOpen(): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("team_settings")
    .select("settlement_open")
    .eq("id", true)
    .maybeSingle();

  if (error) {
    console.error("failed to read team settings:", describeSupabaseError(error));
    return false;
  }
  return data?.settlement_open ?? false;
}
