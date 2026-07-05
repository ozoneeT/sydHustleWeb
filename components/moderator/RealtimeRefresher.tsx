"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { NEW_RESPONSE_EVENT } from "@/lib/moderator/realtime";

/**
 * Subscribes to a Realtime Broadcast channel and refreshes the current
 * Server Component tree whenever a "new_response" ping arrives. The ping
 * itself carries no data — this just triggers a secure, session-scoped
 * refetch on the server rather than trusting anything sent over the
 * (unauthenticated) broadcast channel.
 */
export function RealtimeRefresher({ channelName }: { channelName: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(channelName)
      .on("broadcast", { event: NEW_RESPONSE_EVENT }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, router]);

  return null;
}
