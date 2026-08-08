import Link from "next/link";
import { notFound } from "next/navigation";

import {
  LiveLocationMap,
  type FinalPin,
} from "@/components/console/LiveLocationMap";
import { Card } from "@/components/ui/card";
import {
  getFinalPositions,
  getLiveSession,
} from "@/lib/console/live-locations";

export const metadata = { title: "Live channel — sydHustle Console" };

/**
 * One session's channel, on the map: the Hustler, the Provider, and the
 * Hustle itself, tracked as three independent points. Live while the
 * session is in its movement phase (the map subscribes to the same
 * realtime channel the two apps broadcast on); once finished, the
 * recorded final positions are plotted instead.
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
  const workerName = session?.worker_name?.split(" ")[0] ?? "Hustler";
  const payerName = session?.payer_name?.split(" ")[0] ?? "Provider";

  // The venue the server last saw. The map supersedes it with whatever the
  // apps broadcast, so a mid-session move shows without a reload — but a
  // finished session falls back to the venue recorded against the final
  // positions, which is where the Hustle actually stood at the end.
  const venue =
    session?.venue_lat != null && session.venue_lng != null
      ? {
          lat: session.venue_lat,
          lng: session.venue_lng,
          label: session.venue_label,
        }
      : finals.find((p) => p.venue_lat != null && p.venue_lng != null)
        ? {
            lat: finals.find((p) => p.venue_lat != null)!.venue_lat!,
            lng: finals.find((p) => p.venue_lng != null)!.venue_lng!,
            label: "Hustle location at close",
          }
        : null;

  const finalPins: FinalPin[] = live
    ? []
    : finals.map((position) => ({
        label: position.full_name ?? "Unknown",
        role: position.role,
        lat: position.lat,
        lng: position.lng,
      }));

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
            ? `${session.worker_name ?? "Hustler"} and ${session.payer_name ?? "Provider"}${session.venue_label ? ` · ${session.venue_label}` : ""}`
            : "Finished — showing each participant's recorded final position."}
        </p>
      </div>

      <LiveLocationMap
        conversationId={conversationId}
        finals={finalPins}
        live={live}
        payerName={payerName}
        venue={venue}
        workerName={workerName}
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
