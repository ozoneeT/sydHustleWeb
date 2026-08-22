"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import {
  askDepositReview,
  clearDepositReview,
  flagTransaction,
  markDepositRefunded,
  type HoldState,
} from "@/lib/console/hold-actions";
import type {
  DepositReviewRow,
  DepositReviewStatus,
  ReviewMessageRow,
} from "@/lib/console/holds";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const initialState: HoldState = { error: null, done: null };

const STATUS_TABS: { id: DepositReviewStatus | "all"; label: string }[] = [
  { id: "flagged", label: "Held" },
  { id: "refund_requested", label: "To refund" },
  { id: "refunded", label: "Refunded" },
  { id: "cleared", label: "Cleared" },
  { id: "all", label: "All" },
];

const STATUS_STYLES: Record<DepositReviewStatus, string> = {
  flagged: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  refund_requested: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  refunded: "bg-muted text-muted-foreground",
  cleared: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

const STATUS_LABELS: Record<DepositReviewStatus, string> = {
  flagged: "Held",
  refund_requested: "Refund owed",
  refunded: "Refunded",
  cleared: "Cleared",
};

function naira(value: number) {
  return `₦${value.toLocaleString("en-NG")}`;
}

function when(value: string) {
  return new Date(value).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HeldFundsQueue({
  reviews,
  threads,
  active,
}: {
  reviews: DepositReviewRow[];
  /** Pre-loaded conversation per review, so opening a card does not
   * cost a round trip while somebody is working through a queue. */
  threads: Record<string, ReviewMessageRow[]>;
  active?: DepositReviewStatus;
}) {
  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const isActive = tab.id === "all" ? !active : active === tab.id;
          return (
            <Link
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                isActive
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
              href={
                tab.id === "all"
                  ? "/console/holds"
                  : `/console/holds?status=${tab.id}`
              }
              key={tab.id}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <FlagByReference />

      {reviews.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nothing here. That is the good outcome.
        </p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => (
            <HoldCard
              key={review.id}
              messages={threads[review.id] ?? []}
              review={review}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

/** Freezing something by hand. Kept at the top of the queue rather than
 * on its own page: the reference almost always comes from a row further
 * down, or from a payment report opened in the next tab. */
function FlagByReference() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(flagTransaction, initialState);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="secondary">
        Hold a payment by reference
      </Button>
    );
  }

  return (
    <Card className="space-y-3 p-4">
      <p className="text-sm font-medium">Hold a payment</p>
      <p className="text-xs text-muted-foreground">
        Any credit, by its SYD- reference. If the money has already been
        spent, the account can spend nothing further until this is settled
        — that is what a freeze is, but it is heavier than it looks.
      </p>
      <form action={action} className="space-y-2">
        <Input name="reference" placeholder="SYD-XXXXXXXXXX" />
        <Textarea
          name="note"
          placeholder="Why. They read this sentence, so write it for them."
          rows={2}
        />
        <div className="flex items-center gap-3">
          <Button disabled={pending} type="submit">
            {pending ? "Holding…" : "Hold it"}
          </Button>
          <Button onClick={() => setOpen(false)} type="button" variant="ghost">
            Cancel
          </Button>
          {state.error ? (
            <span className="text-sm text-red-400">{state.error}</span>
          ) : null}
          {state.done ? (
            <span className="text-sm text-emerald-400">{state.done}</span>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

function HoldCard({
  review,
  messages,
}: {
  review: DepositReviewRow;
  messages: ReviewMessageRow[];
}) {
  const [open, setOpen] = useState(review.status === "flagged");

  const [askState, ask, asking] = useActionState(askDepositReview, initialState);
  const [clearState, clear, clearing] = useActionState(
    clearDepositReview,
    initialState
  );
  const [refundState, refund, refunding] = useActionState(
    markDepositRefunded,
    initialState
  );

  return (
    <li>
      <Card className="p-4">
        <button
          className="flex w-full flex-wrap items-start justify-between gap-3 text-left"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          <div className="min-w-0">
            <p className="font-medium">
              {naira(review.amount)}
              <span className="ml-2 text-sm text-muted-foreground">
                {review.displayName ?? review.profileId}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {review.reference} · {when(review.createdAt)} ·{" "}
              {review.origin === "manual"
                ? `held by ${review.flaggedBy ?? "an operator"}`
                : `over ${naira(review.threshold ?? 0)}`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {review.bvnVerified ? "BVN on file" : "No BVN on file"}
              {review.messageCount > 0
                ? ` · ${review.messageCount} message${review.messageCount === 1 ? "" : "s"}`
                : ""}
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[review.status]}`}
          >
            {STATUS_LABELS[review.status]}
          </span>
        </button>

        {open ? (
          <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
            {review.note ? (
              <p className="text-sm text-muted-foreground">
                Reason given: {review.note}
              </p>
            ) : null}
            {review.resolution ? (
              <p className="text-sm text-muted-foreground">
                Told them: {review.resolution}
              </p>
            ) : null}
            {review.refundReference ? (
              <p className="text-sm text-muted-foreground">
                Refunded at the provider as {review.refundReference}.
              </p>
            ) : null}

            {messages.length > 0 ? (
              <div className="space-y-2">
                {messages.map((message) => (
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      message.authorRole === "admin"
                        ? "bg-muted"
                        : "bg-sky-500/10"
                    }`}
                    key={message.id}
                  >
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {message.authorRole === "admin"
                        ? (message.authorLabel ?? "console")
                        : "them"}{" "}
                      · {when(message.createdAt)}
                    </p>
                    {message.body ? <p className="mt-1">{message.body}</p> : null}
                    {message.attachmentUrl ? (
                      <a
                        className="mt-1 inline-block text-xs underline"
                        href={message.attachmentUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {message.attachmentName ?? "Attachment"}
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            {review.status === "flagged" ? (
              <>
                <form action={ask} className="space-y-2">
                  <input name="reviewId" type="hidden" value={review.id} />
                  <Textarea
                    name="body"
                    placeholder="Ask where the money came from…"
                    rows={2}
                  />
                  <div className="flex items-center gap-3">
                    <Button disabled={asking} type="submit" variant="secondary">
                      {asking ? "Sending…" : "Ask"}
                    </Button>
                    {askState.error ? (
                      <span className="text-sm text-red-400">
                        {askState.error}
                      </span>
                    ) : null}
                    {askState.done ? (
                      <span className="text-sm text-emerald-400">
                        {askState.done}
                      </span>
                    ) : null}
                  </div>
                </form>

                <form action={clear} className="space-y-2">
                  <input name="reviewId" type="hidden" value={review.id} />
                  <Input
                    name="resolution"
                    placeholder="What to tell them (optional)"
                  />
                  <div className="flex items-center gap-3">
                    <Button disabled={clearing} type="submit">
                      {clearing ? "Clearing…" : "Clear the hold"}
                    </Button>
                    {clearState.error ? (
                      <span className="text-sm text-red-400">
                        {clearState.error}
                      </span>
                    ) : null}
                    {clearState.done ? (
                      <span className="text-sm text-emerald-400">
                        {clearState.done}
                      </span>
                    ) : null}
                  </div>
                </form>
              </>
            ) : null}

            {review.status === "refund_requested" ? (
              <form action={refund} className="space-y-2">
                <input name="reviewId" type="hidden" value={review.id} />
                <p className="text-sm text-muted-foreground">
                  They asked for this back on{" "}
                  {review.refundRequestedAt
                    ? when(review.refundRequestedAt)
                    : "—"}
                  . Their wallet is already debited. Send{" "}
                  {naira(review.amount)} back to the account it came from
                  from the provider dashboard, then paste the reference here.
                </p>
                <Input
                  name="refundReference"
                  placeholder="Provider transfer reference"
                />
                <div className="flex items-center gap-3">
                  <Button disabled={refunding} type="submit">
                    {refunding ? "Recording…" : "Mark refunded"}
                  </Button>
                  {refundState.error ? (
                    <span className="text-sm text-red-400">
                      {refundState.error}
                    </span>
                  ) : null}
                  {refundState.done ? (
                    <span className="text-sm text-emerald-400">
                      {refundState.done}
                    </span>
                  ) : null}
                </div>
              </form>
            ) : null}
          </div>
        ) : null}
      </Card>
    </li>
  );
}
