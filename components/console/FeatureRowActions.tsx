"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  cancelBoost,
  rerankBoost,
  type BoostActionState,
} from "@/lib/console/featured-actions";

const INITIAL: BoostActionState = { error: null, done: false };

/**
 * Carousel order for one live boost.
 *
 * The only ordering lever there is, and the only decision left to make:
 * hustleBoost is a subscription, so whether a boost runs was settled when
 * the store took the money. Lower numbers lead.
 */
export function BoostRank({ id, rank }: { id: string; rank: number }) {
  const [state, action, pending] = useActionState(rerankBoost, INITIAL);

  return (
    <form action={action} className="flex items-center gap-2">
      <input name="id" type="hidden" value={id} />
      <Input
        aria-label="Carousel rank"
        className="h-8 w-16 text-xs"
        defaultValue={rank}
        max={999}
        min={1}
        name="rank"
        title="Lower numbers appear first in the carousel"
        type="number"
      />
      <Button className="h-8 px-3 text-xs" disabled={pending} type="submit" variant="secondary">
        {pending ? "…" : "Set"}
      </Button>
      {state.error ? (
        <span className="text-xs text-red-400">{state.error}</span>
      ) : null}
    </form>
  );
}

/** Pull a running boost. No refund — see `cancelBoost`. */
export function BoostCancel({ id }: { id: string }) {
  const [state, action, pending] = useActionState(cancelBoost, INITIAL);
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <Button
        className="h-8 px-3 text-xs"
        onClick={() => setArmed(true)}
        type="button"
        variant="ghost"
      >
        Pull
      </Button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input name="id" type="hidden" value={id} />
      <Input
        className="h-8 w-48 text-xs"
        maxLength={300}
        name="reason"
        placeholder="Reason (internal)"
      />
      <Button
        className="h-8 border-red-500/40 px-3 text-xs text-red-400 hover:bg-red-500/10"
        disabled={pending}
        type="submit"
        variant="secondary"
      >
        {pending ? "Pulling…" : "Confirm"}
      </Button>
      <Button
        className="h-8 px-2 text-xs"
        onClick={() => setArmed(false)}
        type="button"
        variant="ghost"
      >
        No
      </Button>
      {state.error ? (
        <span className="text-xs text-red-400">{state.error}</span>
      ) : null}
    </form>
  );
}
