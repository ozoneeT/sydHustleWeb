"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireConsole } from "@/lib/console/dal";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Editing the money ceilings.
 *
 * Saved as a whole table rather than a row at a time. The ten rungs are
 * a single rate card and are almost always adjusted against each other
 * — raising Hustle Master without looking at Hustle Expert is how a
 * ladder ends up non-monotonic — so the form submits all of them and
 * this refuses the set if it does not make sense as a set.
 */

const AMOUNT = z.coerce.number().min(0).max(10_000_000);

const rowSchema = z.object({
  track: z.enum(["hustler", "provider"]),
  rung: z.coerce.number().int().min(0).max(4),
  daily_withdrawal_max: AMOUNT.nullable(),
  deposit_flag_above: AMOUNT.nullable(),
  bvn_above: AMOUNT.nullable(),
});

export type LimitsState = { error: string | null; saved: boolean };

export async function updateMoneyLimits(
  _prev: LimitsState,
  formData: FormData
): Promise<LimitsState> {
  await requireConsole();

  const rows: z.infer<typeof rowSchema>[] = [];
  for (const track of ["hustler", "provider"] as const) {
    for (let rung = 0; rung < 5; rung += 1) {
      const read = (field: string) => {
        const raw = formData.get(`${track}.${rung}.${field}`);
        return raw === null || raw === "" ? null : raw;
      };
      const parsed = rowSchema.safeParse({
        track,
        rung,
        daily_withdrawal_max: read("daily_withdrawal_max"),
        deposit_flag_above: read("deposit_flag_above"),
        bvn_above: read("bvn_above"),
      });
      if (!parsed.success) {
        return {
          error: "Every figure must be a number between 0 and 10,000,000.",
          saved: false,
        };
      }
      rows.push(parsed.data);
    }
  }

  // A ladder that goes down is not a ladder. Caught here rather than in
  // a check constraint because it is a relationship between rows, and
  // because the operator should be told which pair is wrong.
  const climbs = (
    track: "hustler" | "provider",
    field: "daily_withdrawal_max" | "deposit_flag_above"
  ) => {
    const ladder = rows
      .filter((row) => row.track === track)
      .sort((a, b) => a.rung - b.rung)
      .map((row) => row[field] ?? 0);
    return ladder.every((value, index) => index === 0 || value >= ladder[index - 1]!);
  };

  if (!climbs("hustler", "daily_withdrawal_max")) {
    return {
      error:
        "Withdrawal limits have to climb with the rung — a higher rung can't be allowed less than the one below it.",
      saved: false,
    };
  }
  if (!climbs("provider", "deposit_flag_above")) {
    return {
      error:
        "Deposit thresholds have to climb with the rung — a higher rung can't be checked sooner than the one below it.",
      saved: false,
    };
  }

  const supabase = createServerSupabaseClient();
  const stamp = new Date().toISOString();

  // Updated one row at a time rather than upserted: the table's rungs
  // are seeded by migration and are not the console's to create, and an
  // upsert with a typo'd track would quietly invent an eleventh.
  for (const row of rows) {
    const { error } = await supabase
      .from("money_tier_limits")
      .update({
        daily_withdrawal_max:
          row.track === "hustler" ? row.daily_withdrawal_max : null,
        deposit_flag_above:
          row.track === "provider" ? row.deposit_flag_above : null,
        bvn_above: row.track === "hustler" ? row.bvn_above : null,
        updated_at: stamp,
      })
      .eq("track", row.track)
      .eq("rung", row.rung);
    if (error) return { error: error.message, saved: false };
  }

  revalidatePath("/console/limits");
  return { error: null, saved: true };
}

export type BvnModeState = { error: string | null; saved: boolean };

/**
 * The global BVN switch.
 *
 * On, nobody withdraws a naira without a verified BVN, whatever their
 * rung and whatever the amount. It is the blunt instrument — reach for
 * it when something is happening, not as a standing posture, because
 * every honest Hustler mid-withdrawal meets it at the worst possible
 * moment.
 */
export async function updateBvnMode(
  _prev: BvnModeState,
  formData: FormData
): Promise<BvnModeState> {
  await requireConsole();

  const enabled = formData.get("bvn_required_for_all") === "on";

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("aml_settings")
    .update({
      bvn_required_for_all: enabled,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return { error: error.message, saved: false };

  revalidatePath("/console/limits");
  return { error: null, saved: true };
}
