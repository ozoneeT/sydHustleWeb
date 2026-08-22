"use client";

import { useActionState, useState } from "react";

import {
  requestBvn,
  withdrawBvnRequest,
  type HoldState,
} from "@/lib/console/hold-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initialState: HoldState = { error: null, done: null };

/**
 * Asking one person for their BVN, and taking the ask back.
 *
 * Sits on the identity record rather than on its own page: the question
 * it answers — do we trust this identity — is one question, and half of
 * the answer is already on this row.
 *
 * The reason box is required and is shown to them verbatim. A demand
 * for a bank document with no stated reason is how a platform teaches
 * its users to fall for phishing.
 */
export function BvnRequest({
  profileId,
  verified,
  requested,
}: {
  profileId: string;
  verified: boolean;
  requested: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [askState, ask, asking] = useActionState(requestBvn, initialState);
  const [dropState, drop, dropping] = useActionState(
    withdrawBvnRequest,
    initialState
  );

  if (verified) {
    return (
      <span className="text-xs font-medium text-emerald-400">BVN verified</span>
    );
  }

  if (requested) {
    return (
      <form action={drop} className="flex items-center gap-2">
        <input name="profileId" type="hidden" value={profileId} />
        <span className="text-xs font-medium text-amber-400">
          BVN requested — they can&apos;t withdraw
        </span>
        <Button disabled={dropping} size="sm" type="submit" variant="ghost">
          {dropping ? "…" : "Withdraw the ask"}
        </Button>
        {dropState.error ? (
          <span className="text-xs text-red-400">{dropState.error}</span>
        ) : null}
      </form>
    );
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm" variant="secondary">
        Ask for BVN
      </Button>
    );
  }

  return (
    <form action={ask} className="w-full max-w-md space-y-2">
      <input name="profileId" type="hidden" value={profileId} />
      <Textarea
        name="reason"
        placeholder="Why we need it. They read this sentence."
        rows={2}
      />
      <div className="flex items-center gap-2">
        <Button disabled={asking} size="sm" type="submit">
          {asking ? "Asking…" : "Ask for it"}
        </Button>
        <Button
          onClick={() => setOpen(false)}
          size="sm"
          type="button"
          variant="ghost"
        >
          Cancel
        </Button>
        {askState.error ? (
          <span className="text-xs text-red-400">{askState.error}</span>
        ) : null}
        {askState.done ? (
          <span className="text-xs text-emerald-400">{askState.done}</span>
        ) : null}
      </div>
    </form>
  );
}
