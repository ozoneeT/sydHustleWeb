import { HeldFundsQueue } from "@/components/console/HeldFundsQueue";
import { Card } from "@/components/ui/card";
import {
  listDepositReviews,
  listReviewMessages,
  type DepositReviewStatus,
  type ReviewMessageRow,
} from "@/lib/console/holds";

export const metadata = { title: "Held funds — sydHustle Console" };

/** A queue whose whole job is to be current. Never a snapshot. */
export const dynamic = "force-dynamic";

const STATUSES: DepositReviewStatus[] = [
  "flagged",
  "cleared",
  "refund_requested",
  "refunded",
];

function parseStatus(value?: string): DepositReviewStatus | undefined {
  return STATUSES.includes(value as DepositReviewStatus)
    ? (value as DepositReviewStatus)
    : undefined;
}

export default async function HoldsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = parseStatus(status) ?? "flagged";
  const reviews = await listDepositReviews(active);

  // Threads for what is on screen, in parallel. Only for the open
  // statuses: a cleared hold from three months ago is history, and
  // loading its conversation to render a collapsed card is work nobody
  // asked for.
  const withThreads = reviews.filter((row) => row.messageCount > 0);
  const loaded = await Promise.all(
    withThreads.map(async (row) => [row.id, await listReviewMessages(row.id)] as const)
  );
  const threads: Record<string, ReviewMessageRow[]> = Object.fromEntries(loaded);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Held funds</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Deposits above the depositor&apos;s Provider rung land in their
          wallet and stop there: the money cannot be withdrawn, cannot pay
          for a Hustle, cannot move at all. Ask what you need to ask, then
          clear it — or, if they would rather not explain it, they can ask
          for it back and it gets returned to the account it came from.
        </p>
      </div>

      <HeldFundsQueue active={active} reviews={reviews} threads={threads} />

      <Card className="space-y-2 p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Two things worth knowing</p>
        <p>
          <strong className="text-foreground">Clearing is one-way.</strong>{" "}
          The money becomes ordinary money the moment it is cleared and can
          be withdrawn immediately. There is no un-clear; a second hold on
          the same payment would be a new one, and by then the money may be
          gone.
        </p>
        <p>
          <strong className="text-foreground">
            A refund is not made here.
          </strong>{" "}
          The wallet is debited when the user asks for it, but the transfer
          itself goes out of the payment provider&apos;s dashboard, back to
          the account the deposit came from. Sending it anywhere else would
          turn a refund into a payout, which is the exact thing this queue
          exists to prevent.
        </p>
      </Card>
    </div>
  );
}
