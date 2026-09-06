"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2, Send } from "lucide-react";

import { sendNextBatch, startCampaign, type StartState } from "@/lib/console/campaign-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const initialStart: StartState = { error: null, queued: null };

/** How long to wait after a retryable failure before trying that batch again. */
const RETRY_DELAY_MS = 4000;
const MAX_CONSECUTIVE_FAILURES = 3;

/**
 * Runs a campaign to completion, one batch of 100 at a time.
 *
 * The loop lives in the browser but the queue lives in Postgres, so
 * closing this tab pauses the send rather than losing it — reopening the
 * page and pressing the button again picks up exactly where it stopped,
 * and nobody is mailed twice because a row leaves 'pending' when it's sent.
 */
export function CampaignSender({
  campaignId,
  audienceLabel,
  recipientCount,
  status,
  pending,
  sent,
}: {
  campaignId: string;
  audienceLabel: string;
  recipientCount: number;
  status: string;
  pending: number;
  sent: number;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ sent, remaining: pending });
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(status === "sent");
  const [startState, setStartState] = useState<StartState>(initialStart);

  // Set when the operator navigates away mid-send, so the loop stops
  // instead of firing batches at an unmounted component.
  const stopped = useRef(false);
  useEffect(() => () => {
    stopped.current = true;
  }, []);

  const runLoop = useCallback(async () => {
    setRunning(true);
    setError(null);
    let failures = 0;

    // Bounded rather than `while (true)`: a bug that never reports `done`
    // would otherwise hammer Resend forever. 200 batches is 20,000 emails,
    // far past any list this will ever have.
    for (let i = 0; i < 200 && !stopped.current; i++) {
      let result;
      try {
        result = await sendNextBatch(campaignId);
      } catch {
        setError("Lost the connection to the server. Press resume to carry on.");
        break;
      }

      setProgress((prev) => ({
        sent: prev.sent + result.sent,
        remaining: result.remaining,
      }));

      if (result.error) {
        if (!result.retryable) {
          setError(result.error);
          break;
        }
        failures += 1;
        if (failures >= MAX_CONSECUTIVE_FAILURES) {
          setError(`${result.error} Paused after ${failures} attempts — press resume to carry on.`);
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        continue;
      }

      failures = 0;
      if (result.done) {
        setFinished(true);
        break;
      }
    }

    setRunning(false);
    router.refresh();
  }, [campaignId, router]);

  async function start(formData: FormData) {
    const result = await startCampaign(initialStart, formData);
    setStartState(result);
    if (result.error) return;
    setConfirming(false);
    setProgress({ sent: 0, remaining: result.queued ?? 0 });
    await runLoop();
  }

  const total = Math.max(recipientCount, progress.sent + progress.remaining, 1);
  const percent = Math.min(100, Math.round((progress.sent / total) * 100));

  if (finished && progress.remaining === 0) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
        <p className="flex items-center gap-2 font-semibold text-emerald-400">
          <CheckCircle2 className="h-5 w-5" />
          Campaign sent
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {(progress.sent || sent).toLocaleString()} emails handed to Resend.
          Delivery and open counts fill in below as the events arrive.
        </p>
      </div>
    );
  }

  if (running || (status === "sending" && progress.remaining > 0)) {
    return (
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center justify-between gap-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            {running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                Sending…
              </>
            ) : (
              "Paused part-way"
            )}
          </p>
          <p className="text-sm tabular-nums text-muted-foreground">
            {progress.sent.toLocaleString()} / {total.toLocaleString()}
          </p>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        {error && (
          <p className="flex items-start gap-2 text-sm text-amber-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        {running ? (
          <p className="text-xs text-muted-foreground">
            Keep this tab open. If you close it the send pauses — reopen this
            page and press resume, and it carries on from here.
          </p>
        ) : (
          <Button type="button" onClick={runLoop}>
            <Send className="h-4 w-4" />
            Resume sending
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div>
        <h2 className="text-sm font-semibold">Ready to send</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Going to <span className="text-foreground">{audienceLabel}</span> —{" "}
          <span className="font-semibold text-accent">
            {recipientCount.toLocaleString()}
          </span>{" "}
          {recipientCount === 1 ? "person" : "people"}. Anyone who has
          unsubscribed is already excluded.
        </p>
      </div>

      {startState.error && (
        <p className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {startState.error}
        </p>
      )}

      {!confirming ? (
        <Button
          type="button"
          disabled={recipientCount === 0}
          onClick={() => setConfirming(true)}
        >
          <Send className="h-4 w-4" />
          Send campaign
        </Button>
      ) : (
        <form action={start} className="space-y-3">
          <input type="hidden" name="campaignId" value={campaignId} />
          <p
            className={cn(
              "rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200"
            )}
          >
            This sends a real email to {recipientCount.toLocaleString()}{" "}
            {recipientCount === 1 ? "person" : "people"}. It can&apos;t be
            recalled. Sent yourself a test first?
          </p>
          <div className="flex flex-wrap gap-3">
            <Button type="submit">
              <Send className="h-4 w-4" />
              Yes, send it now
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
