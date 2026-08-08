import Link from "next/link";

import { Card } from "@/components/ui/card";
import {
  getFinalPositions,
  getLiveSessions,
} from "@/lib/console/live-locations";

export const metadata = { title: "Location — sydHustle Console" };

/**
 * The Location desk: one channel per active Hustle. Opening a channel
 * shows both parties' live broadcast on the map — the oversight surface
 * for a panic press or suspected foul play. Below it, the recorded final
 * positions of recently finished sessions.
 */
export default async function LocationPage() {
  const [sessions, finals] = await Promise.all([
    getLiveSessions(),
    getFinalPositions(),
  ]);

  // One row per finished conversation; the detail page shows each
  // participant's exact point.
  const finished = new Map<
    string,
    { title: string | null; recordedAt: string; parties: string[] }
  >();
  for (const position of finals) {
    const existing = finished.get(position.conversation_id);
    if (existing) {
      existing.parties.push(position.full_name ?? "Unknown");
    } else {
      finished.set(position.conversation_id, {
        title: position.title,
        recordedAt: position.recorded_at,
        parties: [position.full_name ?? "Unknown"],
      });
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Location</h1>
        <p className="text-sm text-muted-foreground">
          Live channels for every locked Hustle. Open one to watch both
          parties&apos; broadcasts on the map.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Active channels ({sessions.length})
        </h2>
        {sessions.length === 0 ? (
          <Card className="p-6 text-sm text-muted-foreground">
            No Hustle is currently in its movement phase.
          </Card>
        ) : (
          <div className="grid gap-3">
            {sessions.map((session) => (
              <Link
                href={`/console/location/${session.conversation_id}`}
                key={session.conversation_id}
              >
                <Card className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-white/5">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {session.title ?? "Untitled Hustle"}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {session.worker_name ?? "Hustler"} →{" "}
                      {session.payer_name ?? "Provider"}
                      {session.venue_label ? ` · ${session.venue_label}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 font-semibold text-emerald-400">
                      {session.worker_done_at ? "wrapping up" : "live"}
                    </span>
                    <span className="text-muted-foreground">
                      {session.kind}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Finished — final positions on record
        </h2>
        {finished.size === 0 ? (
          <Card className="p-6 text-sm text-muted-foreground">
            No final positions recorded yet.
          </Card>
        ) : (
          <div className="grid gap-2">
            {[...finished.entries()].map(([conversationId, record]) => (
              <Link
                href={`/console/location/${conversationId}`}
                key={conversationId}
              >
                <Card className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm transition-colors hover:bg-white/5">
                  <span className="min-w-0 truncate">
                    <span className="font-semibold">
                      {record.title ?? "Untitled Hustle"}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      · {record.parties.join(", ")}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(record.recordedAt).toLocaleString("en-NG")}
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
