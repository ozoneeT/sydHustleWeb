import type { ResponseSummary } from "@/lib/moderator/data";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "warning";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone === "accent" && "bg-accent/15 text-accent",
        tone === "warning" && "bg-amber-400/15 text-amber-300",
        tone === "neutral" && "bg-white/10 text-muted-foreground"
      )}
    >
      {children}
    </span>
  );
}

function roleLabel(role: string | null) {
  switch (role) {
    case "providing_hustles":
      return "Task poster";
    case "hustling_the_hustles":
      return "Hustler";
    case "both":
      return "Both";
    default:
      return "—";
  }
}

export function ResponsesTable({
  responses,
  surveyorNames,
  emptyMessage = "No responses yet.",
}: {
  responses: ResponseSummary[];
  surveyorNames?: Record<string, string>;
  emptyMessage?: string;
}) {
  if (responses.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">School</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Would use app</th>
            {surveyorNames && <th className="px-4 py-3 font-medium">Surveyor</th>}
            <th className="px-4 py-3 font-medium">Marketing team</th>
          </tr>
        </thead>
        <tbody>
          {responses.map((r) => (
            <tr
              key={r.id}
              className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]"
            >
              <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                {formatDate(r.created_at)}
              </td>
              <td className="px-4 py-3 font-medium">{r.name ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{r.school ?? "—"}</td>
              <td className="px-4 py-3">
                <Badge tone="accent">{roleLabel(r.app_usage_role)}</Badge>
              </td>
              <td className="px-4 py-3">
                <Badge
                  tone={
                    r.would_use_app === "yes"
                      ? "accent"
                      : r.would_use_app === "no"
                      ? "warning"
                      : "neutral"
                  }
                >
                  {r.would_use_app ?? "—"}
                </Badge>
              </td>
              {surveyorNames && (
                <td className="px-4 py-3 text-muted-foreground">
                  {(r.surveyor_id && surveyorNames[r.surveyor_id]) ?? "Unknown"}
                </td>
              )}
              <td className="px-4 py-3">
                {r.join_marketing_team === "yes" ? (
                  <Badge tone="accent">Yes</Badge>
                ) : (
                  <Badge>No</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
