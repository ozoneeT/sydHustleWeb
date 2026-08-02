import { listModerationQueue } from "@/lib/console/data";
import { shortDate } from "@/lib/console/format";

export const metadata = { title: "Moderation — sydHustle Console" };

const OUTCOME_STYLES: Record<string, string> = {
  delivered_flagged: "bg-amber-500/15 text-amber-400",
  blocked: "bg-red-500/15 text-red-400",
  removed_after_sending: "bg-red-500/15 text-red-400",
};

export default async function ModerationPage() {
  const rows = await listModerationQueue();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Moderation</h1>
        <p className="text-sm text-muted-foreground">
          The last {rows.length} moderation events. &ldquo;Delivered
          flagged&rdquo; rows are live in a conversation and are the ones
          needing a human decision.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Layer</th>
              <th className="px-4 py-3">Rule</th>
              <th className="px-4 py-3">Outcome</th>
              <th className="px-4 py-3">Content</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-b border-white/5" key={row.id}>
                <td className="px-4 py-3 text-muted-foreground">
                  {shortDate(row.created_at)}
                </td>
                <td className="px-4 py-3 font-medium">
                  {row.actor_name ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{row.source}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.reason ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      OUTCOME_STYLES[row.outcome] ?? "bg-white/10"
                    }`}
                  >
                    {row.outcome.replaceAll("_", " ")}
                  </span>
                </td>
                <td className="max-w-80 px-4 py-3 text-xs text-muted-foreground">
                  <span className="line-clamp-2">
                    {row.content_snapshot ?? "—"}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
                  Nothing in the queue.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
