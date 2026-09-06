import type { SupabaseClient } from "@supabase/supabase-js";

// Realtime Broadcast channel name. Payloads are intentionally empty/content
// -free "pings" — the survey list reacts by re-fetching its data through a
// secure, session-checked server request, so no PII ever travels over this
// channel.
export const SURVEY_LIST_CHANNEL = "admin-dashboard";

export const NEW_RESPONSE_EVENT = "new_response";

/**
 * Notifies the survey list that a new response has come in, so it can
 * refresh. Uses the REST broadcast endpoint (`httpSend`) so we don't need to
 * open/maintain a websocket connection from a one-shot server action.
 */
export async function broadcastNewResponse(supabase: SupabaseClient) {
  const channel = supabase.channel(SURVEY_LIST_CHANNEL);
  try {
    await channel.httpSend(NEW_RESPONSE_EVENT, {});
  } catch (err) {
    console.error("failed to broadcast to the survey list channel:", err);
  }
}
