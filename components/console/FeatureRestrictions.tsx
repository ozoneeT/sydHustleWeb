"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  FEATURES,
  type FeatureRestriction,
} from "@/lib/console/features";
import {
  setFeatureRestriction,
  type RestrictionState,
} from "@/lib/console/restrictions";

const INITIAL: RestrictionState = { error: null, done: false };

/**
 * Seven switches, thrown one at a time.
 *
 * Laid out as a list of features rather than a list of sanctions, because
 * that is the question being answered: not "how badly do we punish this
 * person" but "which thing should they stop doing while we look". The
 * cost of each is printed beside it, so nobody freezes somebody's
 * earnings over an argument in a chat without seeing that is what they
 * are doing.
 *
 * Account suspension still lives on the report itself — this is the
 * smaller instrument, and having both in one place would invite reaching
 * for the big one out of habit.
 */
export function FeatureRestrictions({
  profileId,
  restrictions,
}: {
  profileId: string;
  restrictions: FeatureRestriction[];
}) {
  // Only live rows gate the UI; expired ones are history, shown below.
  // `active` is stamped on the server - see listRestrictions for why a
  // render may not read the clock itself.
  const live = new Map(
    restrictions.filter((r) => r.active).map((r) => [r.feature, r])
  );

  return (
    <div className="space-y-3">
      {FEATURES.map((feature) => (
        <FeatureRow
          blast={feature.blast}
          current={live.get(feature.key) ?? null}
          feature={feature.key}
          key={feature.key}
          label={feature.label}
          profileId={profileId}
        />
      ))}
    </div>
  );
}

function FeatureRow({
  blast,
  current,
  feature,
  label,
  profileId,
}: {
  blast: string;
  current: FeatureRestriction | null;
  feature: string;
  label: string;
  profileId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [state, submit, pending] = useActionState(
    setFeatureRestriction,
    INITIAL
  );
  const restricted = Boolean(current);

  return (
    <div
      className={`rounded-xl border p-4 ${
        restricted ? "border-amber-500/40 bg-amber-500/5" : "border-white/10"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{blast}</p>
          {current ? (
            <p className="mt-1 text-xs text-amber-400">
              Paused{" "}
              {current.restricted_until
                ? `until ${new Date(current.restricted_until).toLocaleString("en-NG")}`
                : "indefinitely"}{" "}
              · {current.reason}
            </p>
          ) : null}
        </div>

        {restricted ? (
          // Lifting needs no reason and no confirmation step: the risk of
          // an accidental restore is a moderator re-imposing it, while the
          // risk of a slow one is somebody locked out of their own money
          // for longer than we decided.
          <form action={submit}>
            <input name="profileId" type="hidden" value={profileId} />
            <input name="feature" type="hidden" value={feature} />
            <input name="restricted" type="hidden" value="off" />
            <Button
              className="h-8 border-emerald-500/40 px-3 text-xs text-emerald-400 hover:bg-emerald-500/10"
              disabled={pending}
              type="submit"
              variant="secondary"
            >
              {pending ? "Lifting…" : "Lift"}
            </Button>
          </form>
        ) : editing ? null : (
          <Button
            className="h-8 border-amber-500/40 px-3 text-xs text-amber-400 hover:bg-amber-500/10"
            onClick={() => setEditing(true)}
            type="button"
            variant="secondary"
          >
            Pause
          </Button>
        )}
      </div>

      {editing && !restricted ? (
        <form action={submit} className="mt-3 space-y-2">
          <input name="profileId" type="hidden" value={profileId} />
          <input name="feature" type="hidden" value={feature} />
          <input name="restricted" type="hidden" value="on" />

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            For
            <select
              className="rounded-lg border border-white/10 bg-transparent px-2 py-1 text-sm outline-none focus:border-accent/50"
              defaultValue="7"
              name="days"
            >
              <option value="1">1 day</option>
              <option value="3">3 days</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="">Until lifted</option>
            </select>
          </label>

          <label
            className="block text-xs text-muted-foreground"
            htmlFor={`reason-${feature}`}
          >
            Why. Not sent to them; this is the note the next moderator reads.
          </label>
          <textarea
            className="min-h-[4rem] w-full rounded-lg border border-white/10 bg-transparent p-3 text-sm outline-none focus:border-accent/50"
            id={`reason-${feature}`}
            maxLength={1000}
            minLength={10}
            name="reason"
            placeholder="Report #123, repeatedly asking to settle outside the app."
            required
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button
              className="h-8 border-amber-500/40 px-3 text-xs text-amber-400 hover:bg-amber-500/10"
              disabled={pending}
              type="submit"
              variant="secondary"
            >
              {pending ? "Pausing…" : `Pause ${label.toLowerCase()}`}
            </Button>
            <Button
              className="h-8 px-2 text-xs"
              onClick={() => setEditing(false)}
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
            {state.error ? (
              <span className="text-xs text-red-400">{state.error}</span>
            ) : null}
          </div>
        </form>
      ) : null}

      {state.error && !editing ? (
        <p className="mt-2 text-xs text-red-400">{state.error}</p>
      ) : null}
    </div>
  );
}
