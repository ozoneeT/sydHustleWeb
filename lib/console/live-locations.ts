import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * The Location desk's data: every active Hustle session (whose realtime
 * channel `hustle-live:<conversation_id>` carries the parties' live
 * broadcasts), and the recorded final positions of finished ones.
 *
 * Both come from console-only views (see the app repo's
 * 20260808020000_hustle_live_locations.sql) — owned by postgres, revoked
 * from app roles, readable here through the service key like every other
 * console page.
 */

export type LiveSession = {
  conversation_id: string;
  kind: "hustle" | "booking";
  title: string | null;
  status: string;
  worker_done_at: string | null;
  venue_lat: number | null;
  venue_lng: number | null;
  venue_label: string | null;
  payer_id: string | null;
  payer_name: string | null;
  worker_id: string | null;
  worker_name: string | null;
  /** Who is on the move — the worker, except a booking held at the
   * worker's own place, where the payer travels. */
  travelling_party: "worker" | "payer";
  conversation_created_at: string;
};

export type FinalPosition = {
  conversation_id: string;
  profile_id: string;
  /** The party ('worker'/'payer'). Rows written before the three-point
   * model carry the old relative vocabulary instead. */
  role: "worker" | "payer" | "traveller" | "host";
  lat: number;
  lng: number;
  recorded_at: string;
  full_name: string | null;
  title: string | null;
  /** Where the Hustle stood when the session ended — not necessarily the
   * address it was booked at, since the spot can be moved mid-session. */
  venue_lat: number | null;
  venue_lng: number | null;
};

export async function getLiveSessions(): Promise<LiveSession[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("console_live_sessions")
    .select("*")
    .order("conversation_created_at", { ascending: false });
  if (error) throw new Error(`console_live_sessions: ${error.message}`);
  return (data ?? []) as LiveSession[];
}

export async function getLiveSession(
  conversationId: string,
): Promise<LiveSession | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("console_live_sessions")
    .select("*")
    .eq("conversation_id", conversationId)
    .maybeSingle();
  if (error) throw new Error(`console_live_sessions: ${error.message}`);
  return (data as LiveSession | null) ?? null;
}

/** Newest first; the list page shows the recent tail, the detail page
 * filters its own conversation. */
export async function getFinalPositions(
  conversationId?: string,
): Promise<FinalPosition[]> {
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("console_final_positions")
    .select("*")
    .order("recorded_at", { ascending: false });
  if (conversationId) {
    query = query.eq("conversation_id", conversationId);
  } else {
    query = query.limit(60);
  }
  const { data, error } = await query;
  if (error) throw new Error(`console_final_positions: ${error.message}`);
  return (data ?? []) as FinalPosition[];
}

/**
 * One recorded step of a participant's movement.
 *
 * The realtime channel is ephemeral by design: it reaches whoever is
 * listening at the time and is then gone, so an operator opening a session
 * mid-journey used to see a dot appear from nowhere and jump every fifteen
 * metres, with no way to tell where it had come from. These are the points
 * behind that dot, written durably by both apps for as long as the session
 * is live.
 */
export type TrailPoint = {
  conversation_id: string;
  profile_id: string;
  party: "worker" | "payer";
  lat: number;
  lng: number;
  accuracy_meters: number | null;
  recorded_at: string;
  full_name: string | null;
};

/**
 * Ascending, because it is drawn as a path and a path has a direction.
 *
 * Capped: a long session at fifteen metres a point runs to thousands, and
 * past a few thousand the line is denser than the screen can show. The cap
 * takes the OLDEST rows, not the newest, because a truncated path that
 * starts mid-journey is honest about being partial, whereas one that ends
 * before the present looks complete and is wrong about where somebody is.
 */
export async function getLocationTrail(
  conversationId: string,
  limit = 4000,
): Promise<TrailPoint[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("console_location_trail")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("recorded_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`console_location_trail: ${error.message}`);
  return (data ?? []) as TrailPoint[];
}

export type PanicAlert = {
  id: string;
  conversation_id: string;
  profile_id: string;
  full_name: string | null;
  lat: number | null;
  lng: number | null;
  activated_at: string;
  cleared_at: string | null;
  cleared_by: "user" | "desk" | null;
  /** Null means the support mail never went out. An alert nobody was told
   * about is the one that most needs an operator to notice it. */
  notified_at: string | null;
  title: string | null;
  venue_lat: number | null;
  venue_lng: number | null;
  venue_label: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
};

/** Open incidents first, newest first within that. */
export async function getPanicAlerts(
  conversationId?: string,
): Promise<PanicAlert[]> {
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("console_panic_alerts")
    .select("*")
    .order("cleared_at", { ascending: true, nullsFirst: true })
    .order("activated_at", { ascending: false });
  if (conversationId) {
    query = query.eq("conversation_id", conversationId);
  } else {
    query = query.limit(50);
  }
  const { data, error } = await query;
  if (error) throw new Error(`console_panic_alerts: ${error.message}`);
  return (data ?? []) as PanicAlert[];
}
