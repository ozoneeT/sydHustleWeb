"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Clock, HandCoins, Loader2 } from "lucide-react";

import {
  requestSettlement,
  type SettlementState,
} from "@/lib/team/settlement-actions";
import { formatDay } from "@/lib/team/format";
import { cn } from "@/lib/utils";

const CLOSED_MESSAGE =
  "Settlement will be available when sydHustle starts making revenue.";

/**
 * "Request settlement" — present from day one, shut until there is money.
 *
 * IT IS NOT A `disabled` BUTTON, and that is deliberate. A disabled button
 * fires no click event and, in most browsers, no pointer events either, so
 * it can neither be asked why nor answered. It would sit there greyed out
 * and mute, which on a phone — where there is no hover at all — means the
 * person has no way whatsoever to find out when this becomes real.
 *
 * So it is a live button that says no and explains itself: `aria-disabled`
 * for assistive tech, the closed styling for everyone else, a tooltip on
 * hover for a mouse, and the same sentence pinned under it on click for a
 * thumb. Both routes land on one sentence, which is the one thing everyone
 * on this team actually wants to know.
 *
 * The switch behind it lives in the console, and the action re-checks it.
 * Nothing here is a permission.
 */
export function SettlementButton({
  open,
  requestedAt,
}: {
  open: boolean;
  requestedAt: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<SettlementState>({
    error: null,
    requested: false,
  });
  const [explaining, setExplaining] = useState(false);

  const alreadyAsked = Boolean(requestedAt) || state.requested;

  function onClick() {
    if (!open) {
      // Tapping is the only way to ask this question on a phone.
      setExplaining(true);
      return;
    }
    startTransition(async () => setState(await requestSettlement()));
  }

  return (
    <div className="space-y-2">
      <div className="group relative inline-block">
        <button
          aria-disabled={!open}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
            open
              ? "bg-accent text-accent-foreground shadow-lg shadow-accent/25 hover:bg-accent/90"
              : "cursor-not-allowed border border-white/10 bg-white/5 text-muted-foreground",
            pending && "opacity-60"
          )}
          onClick={onClick}
          type="button"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : open ? (
            <HandCoins className="h-4 w-4" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
          {pending
            ? "Sending…"
            : alreadyAsked
              ? "Ask again"
              : "Request settlement"}
        </button>

        {/* Hover, for anyone on a mouse. `pointer-events-none` so the
            tooltip can never swallow the click that opens the tapped
            version of the same sentence. */}
        {!open && (
          <span
            className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 hidden w-64 rounded-xl border border-white/10 bg-[#0b1120] px-3 py-2 text-xs text-muted-foreground shadow-xl shadow-black/40 group-hover:block"
            role="tooltip"
          >
            {CLOSED_MESSAGE}
          </span>
        )}
      </div>

      {!open && explaining && (
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {CLOSED_MESSAGE}
        </p>
      )}

      {open && alreadyAsked && !state.error && (
        <p className="flex items-start gap-2 text-xs text-accent">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {state.requested
            ? "Sent. Whoever handles payouts can see it."
            : `You asked on ${formatDay(requestedAt!.slice(0, 10))}.`}
        </p>
      )}

      {state.error && <p className="text-xs text-red-400">{state.error}</p>}
    </div>
  );
}
