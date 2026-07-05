import { ChevronDown } from "lucide-react";
import type { FullResponse } from "@/lib/moderator/data";
import { appUsageRoleLabels, label as labelFor } from "@/lib/survey-options";
import { ResponseDetail } from "@/components/moderator/ResponseDetail";
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

/**
 * Full survey responses, rendered as expandable cards using native
 * <details>/<summary> — no client JS required for the expand/collapse
 * interaction. Each card's summary shows the key fields for quick scanning;
 * expanding reveals every answer via ResponseDetail.
 */
export function ResponsesList({
  responses,
  surveyorNames,
  emptyMessage = "No responses yet.",
}: {
  responses: FullResponse[];
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
    <div className="space-y-3">
      {responses.map((r) => (
        <details
          key={r.id}
          className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition-colors open:bg-white/[0.05]"
        >
          <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            <span className="whitespace-nowrap text-xs text-muted-foreground">
              {formatDate(r.created_at)}
            </span>
            <span className="font-medium">{r.name ?? "Anonymous"}</span>
            {r.school && (
              <span className="text-sm text-muted-foreground">{r.school}</span>
            )}
            <Badge tone="accent">{labelFor(appUsageRoleLabels, r.app_usage_role)}</Badge>
            <Badge
              tone={
                r.would_use_app === "yes"
                  ? "accent"
                  : r.would_use_app === "no"
                  ? "warning"
                  : "neutral"
              }
            >
              Would use: {r.would_use_app}
            </Badge>
            {r.join_marketing_team === "yes" && <Badge tone="accent">Marketing ✓</Badge>}
            {surveyorNames && (
              <span className="ml-auto text-xs text-muted-foreground">
                {(r.surveyor_id && surveyorNames[r.surveyor_id]) ?? "Unknown surveyor"}
              </span>
            )}
          </summary>
          <div className="border-t border-white/10 px-4 py-5">
            <ResponseDetail
              response={r}
              surveyorName={
                surveyorNames && r.surveyor_id ? surveyorNames[r.surveyor_id] : undefined
              }
            />
          </div>
        </details>
      ))}
    </div>
  );
}
