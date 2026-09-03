import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

import iconNames from "@/lib/console/ionicons-outline.json";

/**
 * The skill catalogue, as the console reads it.
 *
 * The app's Step 1 picker reads `skill_catalog` directly and nothing
 * here is compiled into a build, so a skill added on this page is
 * offered to the next person who opens Add a Skill.
 */

export type ConsoleSkill = {
  id: string;
  name: string;
  name_plural: string;
  icon: string;
  licensed_trade: boolean;
  sort_order: number;
  featured_rank: number | null;
  retired_at: string | null;
  /** Published listings railing under this skill. The number that
   * decides whether it can be deleted or only retired. */
  listing_count: number;
};

export async function listConsoleSkills(): Promise<ConsoleSkill[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc("console_skill_catalog");
  if (error) throw new Error(error.message);

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    name: String(row.name),
    name_plural: String(row.name_plural),
    icon: String(row.icon),
    licensed_trade: row.licensed_trade === true,
    sort_order: Number(row.sort_order),
    featured_rank:
      row.featured_rank === null || row.featured_rank === undefined
        ? null
        : Number(row.featured_rank),
    retired_at: row.retired_at === null ? null : String(row.retired_at),
    listing_count: Number(row.listing_count ?? 0),
  }));
}

/**
 * Every outline glyph Ionicons ships, read out of the app's own icon
 * font at the version it bundles.
 *
 * The table refuses anything that is not `%-outline` and refuses any
 * icon a skill already wears, but neither constraint knows whether a
 * name EXISTS - "stethoscope-outline" satisfies both and draws a blank
 * square in the wizard. So the list is the authority on what is real,
 * and the two constraints stay the authority on what is allowed.
 */
export const ICON_NAMES: readonly string[] = iconNames as string[];

export function iconExists(name: string): boolean {
  return (iconNames as string[]).includes(name);
}
