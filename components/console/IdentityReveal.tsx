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
 * Lifts the NIMC photograph out of the JSON.
 *
 * NIMC returns the portrait inline as a base64 data URI — tens of
 * thousands of characters that push every other field off the screen and
 * tell a human nothing. In a fraud or police case the photograph is
 * often the single most useful field, so it is shown as a picture, and
 * the JSON keeps a placeholder noting its size. Nothing is discarded:
 * the record itself is untouched, this only changes how it is displayed.
 */
function splitPhoto(payload: unknown): { photo: string | null; rest: unknown } {
  if (typeof payload !== "object" || payload === null) {
    return { photo: null, rest: payload };
  }
  const root = payload as Record<string, unknown>;
  const registered = root.registered;
  if (typeof registered !== "object" || registered === null) {
    return { photo: null, rest: payload };
  }

  const reg = registered as Record<string, unknown>;
  const image = reg.image;
  if (typeof image !== "string" || image.length === 0) {
    return { photo: null, rest: payload };
  }

  // Size the decoded bytes, not the data-URI header, so the note is
  // about the photograph rather than the encoding.
  const base64 = image.slice(image.indexOf(",") + 1);
  const kb = Math.max(1, Math.round((base64.length * 3) / 4 / 1024));

  return {
    photo: image,
    rest: {
      ...root,
      registered: { ...reg, image: `[photograph shown above — ~${kb} KB]` },
    },
  };
}

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
        <RecordView record={state.record} />
      ) : null}
    </div>
  );
}

function RecordView({
  record,
}: {
  record: NonNullable<RevealState["record"]>;
}) {
  const { photo, rest } = splitPhoto(record.payload);

  return (
    <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
        Disclosed and logged · not stored anywhere on this page
      </p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-4">
        <Meta label="Provider" value={record.provider} />
        <Meta label="Provider ref" value={record.providerRef} />
        <Meta label="Verified" value={record.verifiedAt} />
        <Meta label="Purge after" value={record.purgeAfter} />
      </dl>

      {photo ? (
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- inline base64 data URI from the record; there is no URL for the optimiser to fetch */}
          <img
            alt="Photograph on the national identity record"
            className="h-36 w-28 rounded-md border border-white/15 object-cover"
            src={photo}
          />
          <p className="text-xs text-muted-foreground">
            The photograph NIMC holds for this person. Shown here rather than
            printed into the JSON below, where it was tens of thousands of
            characters of base64.
          </p>
        </div>
      ) : null}

      {/* `whitespace-pre-wrap` keeps the JSON indentation while letting lines
          wrap, and `break-words` splits any single token too long for a line
          — without it one long value scrolls the whole record sideways. */}
      <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap break-words rounded-md bg-black/40 p-3 text-xs leading-relaxed text-white/90">
        {JSON.stringify(rest, null, 2)}
      </pre>
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
