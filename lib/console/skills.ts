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
  /** EVERY listing railing under this skill, withheld ones included.
   * This is what gates deletion: a removed listing still points here by
   * `skill_id`, so erasing the row would re-rail it just the same. */
  listing_count: number;
  /** What a user would actually find on the Skills feed. */
  live_count: number;
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
    live_count: Number(row.live_count ?? 0),
  }));
}

/**
 * The rails nobody wrote down.
 *
 * A Hustler who types their own trade instead of picking one gets a rail
 * of their own on the Skills feed, keyed on their wording, with no
 * catalogue row behind it. Those are two thirds of what the app shows
 * and none of it was reachable from a console that reads the catalogue.
 */
export type UncategorizedRail = {
  rail_id: string;
  display_name: string;
  /** Live listings only. A rail with nothing live left on it does not
   * appear at all — the decision was already taken on Listings. */
  listing_count: number;
  /** Suspended or taken down. Moved along with the rest, but not a
   * reason on their own for the rail to be in this queue. */
  withheld_count: number;
  /** Owned by a real account, as opposed to the seeded demo listings. */
  owned_count: number;
  /** Frozen by certification — these cannot be moved. See the migration. */
  certified_count: number;
  newest_at: string | null;
};

export async function listUncategorizedRails(): Promise<UncategorizedRail[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc("console_uncategorized_rails");
  if (error) throw new Error(error.message);

  return (data ?? []).map((row: Record<string, unknown>) => ({
    rail_id: String(row.rail_id),
    display_name: String(row.display_name),
    listing_count: Number(row.listing_count ?? 0),
    withheld_count: Number(row.withheld_count ?? 0),
    owned_count: Number(row.owned_count ?? 0),
    certified_count: Number(row.certified_count ?? 0),
    newest_at: row.newest_at === null ? null : String(row.newest_at),
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
