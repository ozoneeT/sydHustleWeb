import { BroadcastForm } from "@/components/console/BroadcastForm";
import { Card } from "@/components/ui/card";
import { describeAudience, type AudienceFilters } from "@/lib/console/audience";
import { listBroadcasts } from "@/lib/console/data";
import { shortDate } from "@/lib/console/format";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = { title: "Broadcast — sydHustle Console" };

export default async function BroadcastPage() {
  const supabase = createServerSupabaseClient();
  const [{ count }, history] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    listBroadcasts(),
  ]);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Broadcast</h1>
        <p className="text-sm text-muted-foreground">
          Sends an announcement to the users you pick: an in-app notification
          plus a push to their registered devices. Leave every filter on
          &ldquo;any&rdquo; and it goes to everybody.
        </p>
      </div>

      <Card className="border-amber-500/30 p-4 text-sm text-muted-foreground">
        The app promises users it never sends promotional pushes, and that
        promise is part of our store compliance. Broadcasts are for things
        users need to know: maintenance, incidents, policy changes, an
        account-specific matter. Narrowing the audience does not change what
        may be said in one. Anything promotional needs an explicit opt-in the
        app does not collect yet.
      </Card>

      <BroadcastForm totalUsers={count ?? 0} />

      {history.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Already sent
          </h2>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Sent</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Audience</th>
                  <th className="px-4 py-3 text-right">People</th>
                  <th className="px-4 py-3 text-right">Delivered</th>
                  <th className="px-4 py-3 text-right">Opened</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr className="border-b border-white/5 last:border-0" key={row.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {shortDate(row.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{row.title}</span>
                      {row.note ? (
                        <span className="block text-xs text-muted-foreground/70">
                          {row.note}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {describeAudience(
                        (row.filters ?? {}) as AudienceFilters
                      ).join(" · ")}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.recipients.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {row.delivered.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {row.opened.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground/70">
            Delivered and opened come from the app&apos;s own receipts, so read
            them as &ldquo;at least this many&rdquo;: deleting a notification
            deletes the row the receipt lived on.
          </p>
        </section>
      ) : null}
    </div>
  );
}
