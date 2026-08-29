"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  saveQuietHours,
  type QuietHoursSettings,
  type QuietHoursState,
} from "@/lib/console/quiet-hours";

const INITIAL: QuietHoursState = { error: null, done: false };

/** Postgres hands back "HH:MM:SS"; <input type="time"> wants "HH:MM". */
function toInput(value: string): string {
  return value.slice(0, 5);
}

export function QuietHoursForm({ settings }: { settings: QuietHoursSettings }) {
  const [state, submit, pending] = useActionState(saveQuietHours, INITIAL);

  return (
    <form action={submit} className="space-y-5">
      <label className="flex items-start gap-3">
        {/* Uncontrolled. `useState(settings.enabled)` reads the prop once
            and never re-syncs, so after a save and revalidate the box could
            show one thing while the server held another - and that stale
            state was what the next save would have submitted. Nothing else
            on this form depends on the value, so the DOM can own it. */}
        <input
          className="mt-1 h-4 w-4 accent-blue-500"
          defaultChecked={settings.enabled}
          name="enabled"
          type="checkbox"
          value="on"
        />
        <span>
          <span className="font-medium">Close the marketplace overnight</span>
          <span className="block text-sm text-muted-foreground">
            Off means there are no quiet hours at all and the app never
            mentions them.
          </span>
        </span>
      </label>

      <div className="flex flex-wrap gap-4">
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Closes at</span>
          <input
            className="rounded-lg border border-white/10 bg-transparent px-3 py-2 outline-none focus:border-accent/50"
            defaultValue={toInput(settings.start)}
            name="start"
            required
            type="time"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Reopens at</span>
          <input
            className="rounded-lg border border-white/10 bg-transparent px-3 py-2 outline-none focus:border-accent/50"
            defaultValue={toInput(settings.end)}
            name="end"
            required
            type="time"
          />
        </label>
      </div>

      <p className="text-xs text-muted-foreground">
        Times are West Africa Time, as they read on a clock in Nigeria. A
        window that crosses midnight is fine — 23:00 to 05:00 means what it
        looks like.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={pending} type="submit" variant="secondary">
          {pending ? "Saving…" : "Save"}
        </Button>
        {state.error ? (
          <span className="text-sm text-red-400">{state.error}</span>
        ) : null}
        {state.done && !state.error ? (
          <span className="text-sm text-emerald-400">Saved.</span>
        ) : null}
      </div>
    </form>
  );
}
