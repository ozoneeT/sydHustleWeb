"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type VerifyPinResult = { valid: boolean; surveyorId?: string };

/**
 * The only surveyor-facing check left. Field collection is over and the
 * surveyor/moderator dashboards are gone — every PIN in the table now does
 * one job: stamping a survey response with whoever collected it, so the
 * contact list at /console/surveylist can say where a contact came from.
 */
export async function verifyModeratorPin(pin: string): Promise<VerifyPinResult> {
  const trimmed = pin.trim();
  if (!/^\d{6}$/.test(trimmed)) {
    return { valid: false };
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("surveyors")
      .select("id")
      .eq("pin", trimmed)
      .maybeSingle();

    if (error || !data) {
      return { valid: false };
    }

    return { valid: true, surveyorId: data.id };
  } catch {
    return { valid: false };
  }
}
