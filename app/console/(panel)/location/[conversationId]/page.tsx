import Link from "next/link";
import { notFound } from "next/navigation";

import {
  LiveLocationMap,
  type MapPin,
} from "@/components/console/LiveLocationMap";
import { Card } from "@/components/ui/card";
import {
  getFinalPositions,
  getLiveSession,
} from "@/lib/console/live-locations";

export const metadata = { title: "Live channel — sydHustle Console" };

/**
 * One session's channel, on the map. Live while the session is in its
 * movement phase (the map subscribes to the same realtime channel the two
 * apps broadcast on); once finished, the recorded final positions are
 * plotted instead.
 */
export default async function LiveChannelPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  if (!/^[0-9a-fA-F-]{36}$/.test(conversationId)) notFound();

  const [session, finals] = await Promise.all([
    getLiveSession(conversationId),
    getFinalPositions(conversationId),
  ]);
  if (!session && finals.length === 0) notFound();

  const live = session !== null;
  // Who is on the move mirrors the app's own rule (travelling_party in the
  // console_live_sessions view) — on a booking held at the worker's place
  // it's the payer travelling, not the worker.
  const workerFirst = session?.worker_name?.split(" ")[0] ?? "Hustler";
  const payerFirst = session?.payer_name?.split(" ")[0] ?? "Provider";
  const payerTravels = session?.travelling_party === "payer";
  const travellerName = payerTravels ? payerFirst : workerFirst;
  const hostName = payerTravels ? workerFirst : payerFirst;

  const pins: MapPin[] = [];
  if (session?.venue_lat != null && session.venue_lng != null) {
    pins.push({
      role: "venue",
      label: session.venue_label ?? "Venue",
      lat: session.venue_lat,
      lng: session.venue_lng,
    });
  }
  if (!live) {
    for (const position of finals) {
      pins.push({
        role: "final",
        label: `${position.full_name ?? "Unknown"} (${position.role})`,
        lat: position.lat,
        lng: position.lng,
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          className="text-sm text-muted-foreground hover:text-white"
          href="/console/location"
        >
          ← All channels
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          {session?.title ?? finals[0]?.title ?? "Hustle session"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {live
            ? `${travellerName} travelling to ${hostName}${session.venue_label ? ` · ${session.venue_label}` : ""}`
            : "Finished — showing each participant's recorded final position."}
        </p>
      </div>

      <LiveLocationMap
        conversationId={conversationId}
        hostName={hostName}
        live={live}
        pins={pins}
        travellerName={travellerName}
      />

      {!live && finals.length > 0 ? (
        <Card className="divide-y divide-white/10 p-0 text-sm">
          {finals.map((position) => (
            <div
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              key={position.profile_id}
            >
              <span>
                <span className="font-semibold">
                  {position.full_name ?? "Unknown"}
                </span>{" "}
                <span className="text-muted-foreground">
                  ({position.role})
                </span>
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {position.lat.toFixed(6)}, {position.lng.toFixed(6)} ·{" "}
                {new Date(position.recorded_at).toLocaleString("en-NG")}
              </span>
            </div>
          ))}
        </Card>
      ) : null}
    </div>
  );
}
