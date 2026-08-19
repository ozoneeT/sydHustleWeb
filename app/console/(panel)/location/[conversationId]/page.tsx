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
  getLocationTrail,
  getPanicAlerts,
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

  const [session, finals, trail, alerts] = await Promise.all([
    getLiveSession(conversationId),
    getFinalPositions(conversationId),
    getLocationTrail(conversationId),
    getPanicAlerts(conversationId),
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

      {alerts.filter((alert) => alert.cleared_at === null).map((alert) => (
        <Card
          className="border-red-500/40 bg-red-500/10 p-4 text-sm"
          key={alert.id}
        >
          <p className="text-base font-semibold text-red-300">
            Panic Mode active &mdash; {alert.full_name ?? "a participant"}
          </p>
          <dl className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            <Detail label="Activated">
              {new Date(alert.activated_at).toLocaleString()}
            </Detail>
            <Detail label="Support notified">
              {alert.notified_at
                ? new Date(alert.notified_at).toLocaleString()
                : "NOT SENT \u2014 no email went out"}
            </Detail>
            <Detail label="Emergency contact">
              {alert.emergency_contact_name
                ? `${alert.emergency_contact_name}${
                    alert.emergency_contact_relationship
                      ? ` (${alert.emergency_contact_relationship})`
                      : ""
                  } \u2014 ${alert.emergency_contact_phone ?? ""}`
                : "none on file"}
            </Detail>
            <Detail label="Payment">frozen while this is open</Detail>
          </dl>
          <p className="mt-3 text-xs text-white/50">
            Do not contact the other party until the desk has decided to.
            They may be the reason for this alert.
          </p>
        </Card>
      ))}

      <LiveLocationMap
        conversationId={conversationId}
        finals={finalPins}
        live={live}
        payerName={payerName}
        trail={trail}
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

function Detail({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-white/50">{label}</dt>
      <dd className="font-medium text-white/90">{children}</dd>
    </div>
  );
}
