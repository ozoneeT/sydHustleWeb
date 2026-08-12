import "server-only";

import {
  PROMO_SURFACES,
  type PromoSurfaceField,
} from "@/lib/console/app-routes";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Promo banners — the house promotion slots in the app.
 *
 * A banner is a row, so changing what the app is pushing is an edit
 * here rather than an App Store release. Two kinds:
 *
 *   custom    — artwork and copy typed below, plus a CTA.
 *   featured  — backed by live hustleBoost placements instead. Either
 *               a hand-picked set, or "any N of them, reshuffled every
 *               M minutes". The shuffle is derived from the clock, so
 *               it needs no job and no stored state.
 *
 * ⚠️ A `featured` banner promotes listings somebody PAID for, and the
 * app labels it PROMOTED for exactly that reason. Do not repurpose one
 * to push house content that was not sold — the label would then be
 * claiming a commercial relationship that does not exist.
 */

export type PromoBannerRow = {
  id: string;
  kind: "custom" | "featured";
  eyebrow: string | null;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  featured_skill_ids: string[];
  featured_count: number;
  rotate_minutes: number;
  show_on_home: boolean;
  show_on_skills: boolean;
  show_on_hustles: boolean;
  show_on_wallet: boolean;
  show_on_messages: boolean;
  is_active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

export async function listPromoBanners(): Promise<PromoBannerRow[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("promo_banners")
    .select("*")
    .order("sort_order")
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as PromoBannerRow[];
}

/** Whether a banner is on screen right now, as opposed to merely
 * enabled — a scheduled one can be active and not yet running. */
export function isLive(row: PromoBannerRow): boolean {
  if (!row.is_active) return false;
  if (
    !row.show_on_home &&
    !row.show_on_skills &&
    !row.show_on_hustles &&
    !row.show_on_wallet &&
    !row.show_on_messages
  ) {
    return false;
  }
  const now = Date.now();
  if (row.starts_at && new Date(row.starts_at).getTime() > now) return false;
  if (row.ends_at && new Date(row.ends_at).getTime() <= now) return false;
  return true;
}

/**
 * How many banners each surface is actually showing.
 *
 * The app takes at most two per surface, ordered by `sort_order`. A
 * third live banner is not an error — it simply never appears — so the
 * console has to say so rather than letting someone wonder why their
 * new promo is invisible.
 */
export function surfaceCounts(
  rows: PromoBannerRow[],
): Record<PromoSurfaceField, number> {
  const live = rows.filter(isLive);
  return Object.fromEntries(
    PROMO_SURFACES.map((surface) => [
      surface.field,
      live.filter((row) => row[surface.field]).length,
    ]),
  ) as Record<PromoSurfaceField, number>;
}

export const SURFACE_LIMIT = 2;
