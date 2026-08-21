"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import {
  decideTransactionReport,
  type TransactionReportState,
} from "@/lib/console/transaction-report-actions";
import {
  REASON_LABELS,
  type TransactionReport,
  type TransactionReportStatus,
} from "@/lib/console/transaction-report-types";

const STATUS_TABS: { id: TransactionReportStatus | "all"; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "investigating", label: "Investigating" },
  { id: "resolved", label: "Resolved" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

const STATUS_STYLES: Record<TransactionReportStatus, string> = {
  open: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  investigating: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  resolved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-muted text-muted-foreground",
};

function naira(value: number) {
  return `₦${value.toLocaleString("en-NG")}`;
}

export function TransactionReportQueue({
  reports,
  counts,
  active,
}: {
  reports: TransactionReport[];
  counts: Record<TransactionReportStatus, number>;
  active?: TransactionReportStatus;
}) {
  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const isActive = tab.id === "all" ? !active : active === tab.id;
          const count = tab.id === "all" ? undefined : counts[tab.id];
          return (
            <Link
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                isActive
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
              href={
                tab.id === "all"
                  ? "/console/transaction-reports"
                  : `/console/transaction-reports?status=${tab.id}`
              }
              key={tab.id}
            >
              {tab.label}
              {count ? (
                <span className="ml-1.5 opacity-70">{count}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {reports.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nothing here. That is the good outcome.
        </p>
      ) : (
        <ul className="space-y-3">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ReportCard({ report }: { report: TransactionReport }) {
  const [open, setOpen] = useState(report.status === "open");
  const [state, action, pending] = useActionState<
    TransactionReportState,
    FormData
  >(decideTransactionReport, { error: null, saved: false });

  /**
   * The reporter's snapshot against the ledger now.
   *
   * Shown side by side rather than merged: the point of storing the
   * snapshot is that the ledger can have changed since they filed, and a
   * merged view would hide exactly the discrepancy worth seeing.
   */
  const ledger = report.ledger;

  return (
    <li className="rounded-xl border bg-card">
      <button
        className="flex w-full items-center gap-3 p-4 text-left"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[report.status]}`}
        >
          {report.status}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">
            {REASON_LABELS[report.reason]}
          </span>
          <span className="block truncate text-sm text-muted-foreground">
            {report.reporterName} · {report.reference}
          </span>
        </span>
        <span className="shrink-0 text-sm text-muted-foreground">
          {new Date(report.createdAt).toLocaleDateString()}
        </span>
      </button>

      {open ? (
        <div className="space-y-4 border-t p-4">
          {report.detail ? (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                What they said
              </h3>
              <p className="mt-1 whitespace-pre-wrap text-sm">{report.detail}</p>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Receipt they filed
              </h3>
              <pre className="mt-1 overflow-x-auto rounded-lg bg-muted p-3 text-xs leading-relaxed">
                {report.receiptSnapshot ?? "No snapshot stored."}
              </pre>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ledger now
              </h3>
              <pre className="mt-1 overflow-x-auto rounded-lg bg-muted p-3 text-xs leading-relaxed">
                {ledger
                  ? [
                      `Amount: ${naira(ledger.amount)}`,
                      `Direction: ${ledger.direction}`,
                      `Reason: ${ledger.reason}`,
                      `Date: ${ledger.createdAt}`,
                      ledger.balanceAfter !== null
                        ? `Balance after: ${naira(ledger.balanceAfter)}`
                        : null,
                      // The line that closes most of these cases. "Money
                      // never arrived" is unanswerable from our own
                      // records alone; with the session id the bank can
                      // be asked directly. Absent on internal escrow
                      // moves, where no bank rail was involved and the
                      // question is a different one entirely.
                      ledger.settlementId
                        ? `Settlement ID: ${ledger.settlementId}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join("\n")
                  : "No ledger entry for this reference."}
              </pre>
            </div>
          </div>

          {report.resolution ? (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Decision
              </h3>
              <p className="mt-1 whitespace-pre-wrap text-sm">
                {report.resolution}
              </p>
            </div>
          ) : null}

          <form action={action} className="space-y-3">
            <input name="id" type="hidden" value={report.id} />
            <textarea
              className="w-full rounded-lg border bg-background p-3 text-sm"
              defaultValue={report.resolution ?? ""}
              maxLength={1000}
              name="resolution"
              placeholder="What you found, and what happens next. The reporter sees this."
              rows={3}
            />
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["investigating", "Investigating"],
                  ["resolved", "Resolve"],
                  ["rejected", "Reject"],
                  ["open", "Reopen"],
                ] as const
              ).map(([status, label]) => (
                <button
                  className="rounded-full border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
                  disabled={pending || report.status === status}
                  key={status}
                  name="status"
                  type="submit"
                  value={status}
                >
                  {label}
                </button>
              ))}
            </div>
            {state.error ? (
              <p className="text-sm text-destructive">{state.error}</p>
            ) : null}
            {state.saved ? (
              <p className="text-sm text-emerald-600">Saved.</p>
            ) : null}
          </form>
        </div>
      ) : null}
    </li>
  );
}
