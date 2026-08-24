"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireConsole } from "@/lib/console/dal";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Editing the release fee rate card.
 *
 * The one rate on this console that is the business's main income, and
 * the only one a user is quoted before they agree to anything. Both
 * facts shape how this is written:
 *
 *   * saved as a whole card, never a rung at a time. The rungs are set
 *     against each other - moving the ₦20,000 rate without looking at
 *     the two either side of it is how a card ends up with a cliff in
 *     it - and `set_fee_tiers` replaces the set in one transaction, so
 *     no release can ever be priced off half a card;
 *   * refused rather than repaired. Every rejection below is a card
 *     somebody meant to write differently, and quietly fixing it would
 *     charge a price nobody chose.
 *
 * The database does the same checks again in `set_fee_tiers`, and it is
 * the authority: this repeats them only to say WHICH rung is wrong, in
 * a sentence, while the operator still has the form in front of them.
 */

const tierSchema = z.object({
  above_amount: z.coerce.number().min(0).max(100_000_000),
  percent: z.coerce.number().min(0).max(30),
});

export type FeeTiersState = { error: string | null; saved: boolean };

/** Turns the exceptions `set_fee_tiers` raises back into sentences, so a
 * card refused by the database for a reason this action did not think to
 * check still reads as an explanation rather than as a stack trace. */
function explain(message: string): string {
  if (message.includes("fee_tier_rate_climbs")) {
    return "Rates can't go up as the Hustle gets bigger — that would pay a larger Hustle less than a smaller one.";
  }
  if (message.includes("fee_tier_duplicate_floor")) {
    return "Two rungs start at the same amount. Each one needs its own floor.";
  }
  if (message.includes("fee_tiers_no_base_rung")) {
    return "The card needs exactly one rung starting at ₦0, or the smallest Hustles are charged nothing.";
  }
  if (message.includes("fee_tiers_empty")) {
    return "A card needs at least one rung. To charge nothing, keep one rung at ₦0 and set it to 0%.";
  }
  if (message.includes("fee_tiers_too_many")) {
    return "Twelve rungs is the most a card can have.";
  }
  if (message.includes("fee_tier_percent_out_of_range")) {
    return "Every rate has to be between 0% and 30%.";
  }
  return message;
}

export async function updateFeeTiers(
  _prev: FeeTiersState,
  formData: FormData
): Promise<FeeTiersState> {
  await requireConsole();

  // The form posts one `above_amount` and one `percent` per row, in
  // document order. Read as parallel lists rather than by index, so
  // removing a middle row in the browser does not leave a hole that has
  // to be compacted here.
  const floors = formData.getAll("above_amount");
  const percents = formData.getAll("percent");
  if (floors.length !== percents.length) {
    return { error: "That form didn't arrive intact. Reload and try again.", saved: false };
  }
  if (floors.length === 0) {
    return {
      error:
        "A card needs at least one rung. To charge nothing, keep one rung at ₦0 and set it to 0%.",
      saved: false,
    };
  }

  const tiers: z.infer<typeof tierSchema>[] = [];
  for (let index = 0; index < floors.length; index += 1) {
    const parsed = tierSchema.safeParse({
      above_amount: floors[index],
      percent: percents[index],
    });
    if (!parsed.success) {
      return {
        error:
          "Every rung needs a starting amount of ₦0 or more and a rate between 0% and 30%.",
        saved: false,
      };
    }
    tiers.push({
      above_amount: Math.round(parsed.data.above_amount * 100) / 100,
      percent: Math.round(parsed.data.percent * 100) / 100,
    });
  }

  const sorted = [...tiers].sort((a, b) => a.above_amount - b.above_amount);

  if (!sorted.some((tier) => tier.above_amount === 0)) {
    return {
      error:
        "The card needs a rung starting at ₦0, or every Hustle below the lowest rung is charged nothing.",
      saved: false,
    };
  }
  for (let index = 1; index < sorted.length; index += 1) {
    const above = sorted[index]!;
    const below = sorted[index - 1]!;
    if (above.above_amount === below.above_amount) {
      return {
        error: `Two rungs both start at ₦${below.above_amount.toLocaleString("en-NG")}. Each one needs its own floor.`,
        saved: false,
      };
    }
    // The cliff, and the only rule here that is about users rather than
    // about the form being filled in properly. The whole Hustle is
    // charged at the rate its size falls into, so a rate that rises at a
    // boundary means the Hustle just over it takes home LESS than the one
    // just under - and the sensible move for a Hustler is to talk the
    // price back down.
    if (above.percent > below.percent) {
      const gross = above.above_amount;
      return {
        error: `${above.percent}% above ₦${gross.toLocaleString("en-NG")} is higher than the ${below.percent}% below it. That would pay a ₦${(gross + 1).toLocaleString("en-NG")} Hustle less than a ₦${gross.toLocaleString("en-NG")} one, so rates have to fall — or stay level — as the amount climbs.`,
        saved: false,
      };
    }
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.rpc("set_fee_tiers", { p_tiers: sorted });
  if (error) {
    return { error: explain(error.message), saved: false };
  }

  // Everywhere the card is stated. The app reads the table itself and
  // needs nothing from here; these are the rendered copies.
  revalidatePath("/console/earnings");
  revalidatePath("/console/payments");
  revalidatePath("/support");
  return { error: null, saved: true };
}
