import type { SupabaseClient } from "@supabase/supabase-js";

// Realtime Broadcast channel names. Payloads are intentionally empty/content
// -free "pings" — dashboards react by re-fetching their data through a
// secure, session-checked server request, so no PII ever travels over these
// channels.
export const ADMIN_CHANNEL = "admin-dashboard";

export function surveyorChannel(surveyorId: string) {
  return `surveyor:${surveyorId}`;
}

export const NEW_RESPONSE_EVENT = "new_response";

/**
 * Notifies the surveyor's dashboard and the admin dashboard that a new
 * survey response has come in, so they can refresh. Uses the REST broadcast
 * endpoint (`httpSend`) so we don't need to open/maintain a websocket
 * connection from a one-shot server action.
 */
export async function broadcastNewResponse(
  supabase: SupabaseClient,
  surveyorId: string
) {
  const channel = supabase.channel(surveyorChannel(surveyorId));
  try {
    await channel.httpSend(NEW_RESPONSE_EVENT, {});
  } catch (err) {
    console.error("failed to broadcast to surveyor channel:", err);
  }

  const adminChannel = supabase.channel(ADMIN_CHANNEL);
  try {
    await adminChannel.httpSend(NEW_RESPONSE_EVENT, {});
  } catch (err) {
    console.error("failed to broadcast to admin channel:", err);
  }
}
