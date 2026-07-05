import "server-only";

import { randomInt } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

function generateCandidatePin() {
  return String(randomInt(100000, 1000000));
}

/**
 * Generates a 6-digit PIN that doesn't already exist in the surveyors
 * table. Collisions are astronomically unlikely (~900,000 possible PINs)
 * but we retry a few times just in case before giving up.
 */
export async function generateUniquePin(
  supabase: SupabaseClient
): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateCandidatePin();
    const { data, error } = await supabase
      .from("surveyors")
      .select("id")
      .eq("pin", candidate)
      .maybeSingle();

    if (error) {
      throw new Error("Failed to verify PIN uniqueness.");
    }

    if (!data) {
      return candidate;
    }
  }

  throw new Error("Could not generate a unique PIN. Please try again.");
}
