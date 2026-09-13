import { cn } from "@/lib/utils";
import type { ContributionStatus } from "@/lib/team/data";

const STYLE: Record<ContributionStatus, string> = {
  pending: "bg-amber-400/15 text-amber-300",
  approved: "bg-accent/15 text-accent",
  rejected: "bg-red-500/15 text-red-300",
};

const LABEL: Record<ContributionStatus, string> = {
  pending: "Waiting to be checked",
  approved: "Counted",
  rejected: "Not counted",
};

export function StatusPill({
  status,
  className,
}: {
  status: ContributionStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium",
        STYLE[status],
        className
      )}
    >
      {LABEL[status]}
    </span>
  );
}
