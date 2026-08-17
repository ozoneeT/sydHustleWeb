import { TransactionReportQueue } from "@/components/console/TransactionReportQueue";
import { requireConsole } from "@/lib/console/dal";
import {
  listTransactionReports,
  transactionReportCounts,
  type TransactionReportStatus,
} from "@/lib/console/transaction-reports";

export const metadata = { title: "Payment reports — sydHustle Console" };

const STATUSES: TransactionReportStatus[] = [
  "open",
  "investigating",
  "resolved",
  "rejected",
];

/**
 * Someone saying a payment went wrong.
 *
 * Not the moderation queue and not the appeals desk, and the distinction
 * decides how each case is worked:
 *
 * - MODERATION is about content and safety, between users.
 * - AN APPEAL is two users disagreeing about whether work was done, with
 *   escrow frozen until someone rules.
 * - A REPORT is one user saying OUR record looks wrong to them - money
 *   that left and never landed, a figure that does not match, a charge
 *   they do not recognise. The other party is usually not involved at all.
 *
 * Each case carries the receipt as the reporter saw it, beside what the
 * ledger says now. The difference between those two is usually the answer.
 */
export default async function TransactionReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireConsole();

  const { status } = await searchParams;
  const active = STATUSES.includes(status as TransactionReportStatus)
    ? (status as TransactionReportStatus)
    : undefined;

  const [reports, counts] = await Promise.all([
    listTransactionReports(active),
    transactionReportCounts(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payment reports</h1>
        <p className="text-sm text-muted-foreground">
          Users disputing their own transactions. Each case shows the receipt
          they were looking at when they filed, next to what the ledger says
          now - a mismatch between the two is usually the whole story.
        </p>
      </div>

      <TransactionReportQueue
        active={active}
        counts={counts}
        reports={reports}
      />
    </div>
  );
}
