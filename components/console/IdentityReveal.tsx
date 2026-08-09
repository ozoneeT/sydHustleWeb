"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  revealIdentityRecord,
  type RevealState,
} from "@/lib/console/identity-actions";

type IdentityRevealProps = {
  profileId: string;
  label: string;
};

const INITIAL: RevealState = { error: null, record: null };

/**
 * The reveal control: a reason, then the record.
 *
 * Collapsed by default and one row at a time. Opening a NIMC record —
 * name, date of birth, registered address, phone, photograph — is not
 * something to do by scrolling past it, so the reason box is the thing
 * that appears first and the plaintext only exists after it is filled.
 */
export function IdentityReveal({ profileId, label }: IdentityRevealProps) {
  const [state, action, pending] = useActionState(
    revealIdentityRecord,
    INITIAL
  );
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm" variant="secondary">
        Open record
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <form action={action} className="flex flex-wrap items-center gap-2">
        <input name="profileId" type="hidden" value={profileId} />
        <Input
          className="w-72"
          maxLength={500}
          name="reason"
          placeholder="Reason — case, dispute or request ref"
          required
        />
        <Button disabled={pending} size="sm" type="submit">
          {pending ? "Opening…" : "Reveal"}
        </Button>
        <Button
          onClick={() => setOpen(false)}
          size="sm"
          type="button"
          variant="ghost"
        >
          Cancel
        </Button>
      </form>

      <p className="text-xs text-muted-foreground">
        This is logged against {label} with the reason you type, permanently
        and uneditably.
      </p>

      {state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}

      {state.record ? (
        <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
            Disclosed and logged · not stored anywhere on this page
          </p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-4">
            <Meta label="Provider" value={state.record.provider} />
            <Meta label="Provider ref" value={state.record.providerRef} />
            <Meta label="Verified" value={state.record.verifiedAt} />
            <Meta label="Purge after" value={state.record.purgeAfter} />
          </dl>
          <pre className="max-h-[28rem] overflow-auto rounded-md bg-black/40 p-3 text-xs leading-relaxed text-white/90">
            {JSON.stringify(state.record.payload, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide">{label}</dt>
      <dd className="text-white/80">{value ?? "—"}</dd>
    </div>
  );
}
