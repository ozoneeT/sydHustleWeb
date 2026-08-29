"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireConsole } from "@/lib/console/dal";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Closing time for the marketplace.
 *
 * The app sends students to meet strangers for money, and the hour is one
 * of the largest factors in how safe that is — a Hustle at 2am is a
 * different risk from the same Hustle at 2pm, whatever the verification
 * says. So the marketplace can be given a closing time.
 *
 * Everything about it is set from here: whether it runs at all, and between
 * which hours. Nothing is compiled into the app.
 */

export type QuietHoursSettings = {
  enabled: boolean;
  /** "HH:MM:SS" on the WAT wall clock. Nigeria has no daylight saving, so
   * these mean the same thing all year. */
  start: string;
  end: string;
  /** Whether the window happens to be open at this moment — computed by the
   * database against Africa/Lagos, not against this server's clock. */
  activeNow: boolean;
};

export type QuietHoursState = { error: string | null; done: boolean };

export async function getQuietHours(): Promise<QuietHoursSettings> {
  await requireConsole();
  const supabase = createServerSupabaseClient();

  const [settings, state] = await Promise.all([
    supabase
      .from("platform_settings")
      .select("quiet_hours_enabled, quiet_hours_start, quiet_hours_end")
      .eq("id", 1)
      .maybeSingle(),
    supabase.rpc("quiet_hours_active"),
  ]);

  if (settings.error) throw new Error(settings.error.message);

  return {
    enabled: settings.data?.quiet_hours_enabled ?? false,
    start: settings.data?.quiet_hours_start ?? "00:00:00",
    end: settings.data?.quiet_hours_end ?? "05:00:00",
    activeNow: state.data === true,
  };
}

const schema = z.object({
  enabled: z.enum(["on", "off"]),
  // <input type="time"> gives "HH:MM"; Postgres takes it as a `time`.
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function saveQuietHours(
  _prev: QuietHoursState,
  formData: FormData
): Promise<QuietHoursState> {
  await requireConsole();

  const parsed = schema.safeParse({
    enabled: formData.get("enabled") ?? "off",
    start: formData.get("start"),
    end: formData.get("end"),
  });
  if (!parsed.success) {
    return { error: "Give a start and an end time.", done: false };
  }

  const { enabled, start, end } = parsed.data;

  // A zero-length window is refused here rather than silently treated as
  // "off" by the database, because the two readings of it are so far apart
  // — nothing, or the marketplace shut for twenty-four hours — that
  // guessing which one somebody meant is worse than asking.
  if (enabled === "on" && start === end) {
    return {
      error: "Start and end can't be the same time — that's not a window.",
      done: false,
    };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.rpc("set_quiet_hours", {
    p_enabled: enabled === "on",
    p_start: start,
    p_end: end,
  });
  if (error) return { error: error.message, done: false };

  revalidatePath("/console/quiet-hours");
  return { error: null, done: true };
}
