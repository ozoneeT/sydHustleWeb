import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * The Skill LISTINGS — not the catalogue.
 *
 * `skill_catalog` is the taxonomy: the words a Hustler may pick from.
 * This is what they actually published, one card per person per trade,
 * with their own photos, prices and description. Until this page the
 * console could reach one only through a report somebody had filed.
 *
 * Read a page at a time. There is no version of this that loads the
 * whole table: it only grows, and the operator's job here is to search
 * for one card, not to scroll past ten thousand.
 */

export type ListingState = "all" | "live" | "suspended" | "removed";

export type SkillListing = {
  id: string;
  skill_name: string;
  display_name: string;
  rail_id: string;
  cover_photo: string | null;
  bio: string;
  price_amount: number | null;
  availability: string;
  certified: boolean;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  removed_at: string | null;
  removal_kind: "suspended" | "removed" | null;
  removed_reason: string | null;
  info_request: string | null;
  hustler_id: string | null;
  owner_name: string | null;
  owner_email: string | null;
};

export type ListingCounts = {
  live: number;
  suspended: number;
  removed: number;
  total: number;
};

/** How many rows one page holds. Small enough to scan, large enough that
 *  a search rarely needs a second page. */
export const PAGE_SIZE = 25;

export type ListingCursor = { before: string; beforeId: string } | null;

export type ListingPage = {
  rows: SkillListing[];
  /** The cursor for the NEXT page, or null when this was the last one. */
  next: ListingCursor;
};

function toListing(row: Record<string, unknown>): SkillListing {
  return {
    id: String(row.id),
    skill_name: String(row.skill_name ?? ""),
    display_name: String(row.display_name ?? ""),
    rail_id: String(row.rail_id ?? ""),
    cover_photo: row.cover_photo ? String(row.cover_photo) : null,
    bio: String(row.bio ?? ""),
    price_amount:
      row.price_amount === null || row.price_amount === undefined
        ? null
        : Number(row.price_amount),
    availability: String(row.availability ?? ""),
    certified: row.certified === true,
    rating_avg: Number(row.rating_avg ?? 0),
    rating_count: Number(row.rating_count ?? 0),
    created_at: String(row.created_at),
    removed_at: row.removed_at ? String(row.removed_at) : null,
    removal_kind:
      row.removal_kind === "suspended" || row.removal_kind === "removed"
        ? row.removal_kind
        : null,
    removed_reason: row.removed_reason ? String(row.removed_reason) : null,
    info_request: row.info_request ? String(row.info_request) : null,
    hustler_id: row.hustler_id ? String(row.hustler_id) : null,
    owner_name: row.owner_name ? String(row.owner_name) : null,
    owner_email: row.owner_email ? String(row.owner_email) : null,
  };
}

export async function listSkillListings(params: {
  query?: string;
  state?: ListingState;
  cursor?: ListingCursor;
}): Promise<ListingPage> {
  const supabase = createServerSupabaseClient();
  // One more than the page, so "is there another page" is answered by
  // the read itself rather than by a second count query that could
  // disagree with it.
  const { data, error } = await supabase.rpc("console_list_skill_listings", {
    p_query: params.query?.trim() || null,
    p_state: params.state ?? "all",
    p_limit: PAGE_SIZE + 1,
    p_before: params.cursor?.before ?? null,
    p_before_id: params.cursor?.beforeId ?? null,
  });
  if (error) throw new Error(error.message);

  const all = (data ?? []).map(toListing);
  const rows = all.slice(0, PAGE_SIZE);
  const last = rows[rows.length - 1];
  return {
    rows,
    next:
      all.length > PAGE_SIZE && last
        ? { before: last.created_at, beforeId: last.id }
        : null,
  };
}

export async function getListingCounts(): Promise<ListingCounts> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc("console_skill_listing_counts");
  if (error) throw new Error(error.message);
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    live: Number(row.live ?? 0),
    suspended: Number(row.suspended ?? 0),
    removed: Number(row.removed ?? 0),
    total: Number(row.total ?? 0),
  };
}
