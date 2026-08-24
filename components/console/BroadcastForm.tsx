"use client";

import { useActionState, useEffect, useState } from "react";

import {
  AudienceFields,
  type Person,
} from "@/components/console/AudienceFields";
import {
  previewBroadcastAudience,
  sendBroadcast,
  type BroadcastState,
} from "@/lib/console/actions";
import { APP_ROUTES } from "@/lib/console/app-routes";
import {
  describeAudience,
  isEmptyAudience,
  type AudienceFilters,
} from "@/lib/console/audience";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: BroadcastState = { error: null, sent: null };

const SELECT_CLASS =
  "h-10 w-full rounded-lg border border-white/10 bg-transparent px-3 text-sm";

type Preview = {
  count: number;
  reachable: number;
  sample: { id: string; name: string }[];
};

export function BroadcastForm({ totalUsers }: { totalUsers: number }) {
  const [state, formAction, pending] = useActionState(
    sendBroadcast,
    initialState
  );
  const [filters, setFilters] = useState<AudienceFilters>({});
  const [exclude, setExclude] = useState<AudienceFilters>({});
  const [picked, setPicked] = useState<Person[]>([]);
  const [excluded, setExcluded] = useState<Person[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  /** A failed count and an empty one are both "0 people" to the form, and
   * they are not the same thing. Tracked separately so a preview outage
   * says so instead of claiming nobody matches. */
  const [previewFailed, setPreviewFailed] = useState(false);

  /**
   * The count is re-asked for on every change, debounced.
   *
   * `cancelled` matters more than the debounce does: two edits in quick
   * succession produce two in-flight queries, and the slower one is not
   * necessarily the older one. Without the guard, a stale answer can
   * land last and put a number on screen that belongs to filters the
   * operator has already changed, which is the one number in this form
   * that has to be right.
   */
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setPreviewing(true);
      previewBroadcastAudience(filters, exclude)
        .then((result) => {
          if (cancelled) return;
          setPreview(result);
          setPreviewFailed(false);
        })
        .catch(() => {
          if (cancelled) return;
          setPreview(null);
          setPreviewFailed(true);
        })
        .finally(() => {
          if (!cancelled) setPreviewing(false);
        });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filters, exclude]);

  function setPeople(people: Person[]) {
    setPicked(people);
    const next = { ...filters };
    if (people.length === 0) delete next.profile_ids;
    else next.profile_ids = people.map((person) => person.id);
    setFilters(next);
  }

  function setExcludedPeople(people: Person[]) {
    setExcluded(people);
    const next = { ...exclude };
    if (people.length === 0) delete next.profile_ids;
    else next.profile_ids = people.map((person) => person.id);
    setExclude(next);
  }

  function reset() {
    setPicked([]);
    setExcluded([]);
    setFilters({});
    setExclude({});
  }

  if (state.sent !== null && state.error === null) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm">
        <p className="font-semibold text-emerald-400">
          Sent to {state.sent.toLocaleString()}{" "}
          {state.sent === 1 ? "person" : "people"}.
        </p>
        <p className="mt-1 text-muted-foreground">
          It is in their notification list now, and pushes are going out to
          registered devices.
        </p>
        <Button
          className="mt-4"
          onClick={() => {
            window.location.href = "/console/broadcast";
          }}
          type="button"
          variant="secondary"
        >
          Write another
        </Button>
      </div>
    );
  }

  const summary = describeAudience(filters);
  const exemptions = isEmptyAudience(exclude) ? null : describeAudience(exclude);
  const count = preview?.count ?? 0;
  const unreachable = Math.max(0, count - (preview?.reachable ?? 0));

  return (
    <form action={formAction} className="space-y-8">
      <input name="filters" type="hidden" value={JSON.stringify(filters)} />
      <input name="exclude" type="hidden" value={JSON.stringify(exclude)} />

      {/* ---------------- Audience ---------------- */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Who gets it
          </h2>
          <button
            className="text-xs text-muted-foreground underline hover:text-white"
            onClick={reset}
            type="button"
          >
            Reset to everyone
          </button>
        </div>

        <AudienceFields
          idPrefix="target"
          onChange={setFilters}
          onPeopleChange={setPeople}
          people={picked}
          value={filters}
          withPeople
        />

        <label className="flex items-start gap-3 text-sm text-muted-foreground">
          <input
            checked={filters.include_suspended ?? false}
            className="mt-1"
            onChange={(event) => {
              const next = { ...filters };
              if (event.target.checked) next.include_suspended = true;
              else delete next.include_suspended;
              setFilters(next);
            }}
            type="checkbox"
          />
          <span>
            Include suspended and terminated accounts. Off by default: they
            are locked out and cannot act on anything a broadcast asks of
            them. Turn it on for a policy notice that has to reach them
            anyway.
          </span>
        </label>
      </section>

      {/* ---------------- Exemptions ---------------- */}
      <ExemptSection
        onChange={setExclude}
        onPeopleChange={setExcludedPeople}
        people={excluded}
        value={exclude}
      />

      <AudienceCount
        count={count}
        exemptions={exemptions}
        failed={previewFailed}
        loading={previewing}
        sample={preview?.sample ?? []}
        summary={summary}
        totalUsers={totalUsers}
        unreachable={unreachable}
      />

      {/* ---------------- Message ---------------- */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          What it says
        </h2>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            maxLength={80}
            name="title"
            placeholder="e.g. Scheduled maintenance tonight"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Message</Label>
          <Textarea
            id="body"
            maxLength={500}
            name="body"
            placeholder="Keep it short. This lands on lock screens."
            required
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="url">Opens</Label>
          <select
            className={SELECT_CLASS}
            defaultValue="/notifications"
            id="url"
            name="url"
          >
            {APP_ROUTES.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.routes.map((route) => (
                  <option key={route.path} value={route.path}>
                    {route.label} ({route.path})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="text-xs text-muted-foreground/70">
            Where the app goes when someone taps the notification.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">Internal note (optional)</Label>
          <Input
            id="note"
            maxLength={200}
            name="note"
            placeholder="Why this went out. Only ever seen here."
          />
        </div>
      </section>

      {/* ---------------- Send ---------------- */}
      <div className="space-y-4 border-t border-white/10 pt-6">
        <label className="flex items-start gap-3 text-sm text-muted-foreground">
          <input className="mt-1" name="confirm" type="checkbox" />
          <span>
            I understand this goes to{" "}
            <strong className="text-white">{count.toLocaleString()}</strong>{" "}
            {count === 1 ? "person" : "people"} ({summary.join(" · ")}
            {exemptions ? `, except ${exemptions.join(" · ")}` : ""}) and
            cannot be unsent.
          </span>
        </label>

        {state.error ? (
          <p className="text-sm text-red-400">{state.error}</p>
        ) : null}

        <Button
          disabled={pending || previewFailed || count === 0}
          type="submit"
        >
          {pending
            ? "Sending…"
            : previewFailed
              ? "Can't count this audience"
              : count === 0
                ? "Nobody matches this audience"
                : `Send to ${count.toLocaleString()}`}
        </Button>
      </div>
    </form>
  );
}

/**
 * The exemption, folded away until it is wanted.
 *
 * Open by default it would read as a second required decision, and most
 * sends have nothing to exempt. Closed, it still announces itself when
 * something is set, because an exemption the operator has forgotten
 * about is a silently smaller audience.
 */
function ExemptSection({
  onChange,
  onPeopleChange,
  people,
  value,
}: {
  onChange: (filters: AudienceFilters) => void;
  onPeopleChange: (people: Person[]) => void;
  people: Person[];
  value: AudienceFilters;
}) {
  const active = !isEmptyAudience(value);
  const [open, setOpen] = useState(false);

  return (
    <section className="space-y-4 rounded-xl border border-white/10 bg-white/[0.015] p-4">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Except</h2>
          <p className="text-xs text-muted-foreground">
            Anyone matching these is left out, whatever the filters above
            say. Use it to spare the people a message would be pointless
            for: the ones who already subscribed, already verified, already
            listed a Skill.
          </p>
        </div>
        <button
          className="shrink-0 text-xs text-muted-foreground underline hover:text-white"
          onClick={() => setOpen((was) => !was)}
          type="button"
        >
          {open ? "Hide" : active ? "Edit exemption" : "Add an exemption"}
        </button>
      </div>

      {active && !open ? (
        <p className="text-xs text-amber-400/90">
          {describeAudience(value).join(" · ")} are being left out.
        </p>
      ) : null}

      {open ? (
        <>
          <AudienceFields
            idPrefix="exempt"
            onChange={onChange}
            onPeopleChange={onPeopleChange}
            people={people}
            value={value}
            withPeople
          />
          {active ? (
            <button
              className="text-xs text-muted-foreground underline hover:text-white"
              onClick={() => {
                onPeopleChange([]);
                onChange({});
              }}
              type="button"
            >
              Clear the exemption
            </button>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

/**
 * The number, and enough context to tell a good number from a wrong one.
 *
 * A bare count is easy to misread: 4,812 looks fine whether it means
 * "every Hustler" or "everybody, because a filter did not apply". The
 * share of the whole user base and a few of the names it selected are
 * what turn it into something checkable in a couple of seconds.
 */
function AudienceCount({
  count,
  exemptions,
  failed,
  loading,
  sample,
  summary,
  totalUsers,
  unreachable,
}: {
  count: number;
  exemptions: string[] | null;
  failed: boolean;
  loading: boolean;
  sample: { id: string; name: string }[];
  summary: string[];
  totalUsers: number;
  unreachable: number;
}) {
  const share = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums">
          {loading ? "…" : count.toLocaleString()}
        </span>
        <span className="text-sm text-muted-foreground">
          {count === 1 ? "person" : "people"}
          {totalUsers > 0 && !loading
            ? ` · ${share}% of all ${totalUsers.toLocaleString()}`
            : ""}
        </span>
      </div>

      <p className="mt-1 text-sm text-muted-foreground">
        {summary.join(" · ")}
        {exemptions ? (
          <span className="text-amber-400/90">
            {" "}
            · except {exemptions.join(" · ")}
          </span>
        ) : null}
      </p>

      {failed ? (
        <p className="mt-2 text-xs text-red-400">
          Could not count this audience. Nothing is being blocked on purpose,
          the count simply is not trustworthy right now. Change a filter to
          retry.
        </p>
      ) : null}

      {!loading && unreachable > 0 ? (
        <p className="mt-2 text-xs text-amber-400/90">
          {unreachable.toLocaleString()} of them have no registered device, so
          they will see this in the app but will not get a push.
        </p>
      ) : null}

      {!loading && sample.length > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground/70">
          Newest matches: {sample.map((person) => person.name).join(", ")}
        </p>
      ) : null}
    </div>
  );
}
