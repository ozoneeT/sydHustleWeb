"use client";

import { useActionState, useEffect, useState } from "react";

import {
  previewBroadcastAudience,
  searchBroadcastRecipients,
  sendBroadcast,
  type BroadcastState,
} from "@/lib/console/actions";
import { APP_ROUTES } from "@/lib/console/app-routes";
import {
  CHOICE_FIELDS,
  choiceValue,
  describeAudience,
  withChoice,
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

type Person = { id: string; name: string; school: string | null };

export function BroadcastForm({ totalUsers }: { totalUsers: number }) {
  const [state, formAction, pending] = useActionState(
    sendBroadcast,
    initialState
  );
  const [filters, setFilters] = useState<AudienceFilters>({});
  const [picked, setPicked] = useState<Person[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  /** A failed count and an empty one are both "0 people" to the form, and
   * they are not the same thing. Tracked separately so a preview outage
   * says so instead of claiming nobody matches. */
  const [previewFailed, setPreviewFailed] = useState(false);

  /**
   * The count is re-asked for on every filter change, debounced.
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
      previewBroadcastAudience(filters)
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
  }, [filters]);

  const activityMode = filters.inactive_days
    ? "inactive"
    : filters.active_within_days
      ? "active"
      : "";
  const activityDays =
    filters.inactive_days ?? filters.active_within_days ?? 14;

  function setActivity(mode: string, days: number) {
    const next = { ...filters };
    delete next.inactive_days;
    delete next.active_within_days;
    if (mode === "inactive") next.inactive_days = days;
    if (mode === "active") next.active_within_days = days;
    setFilters(next);
  }

  const joinedMode = filters.joined_within_days
    ? "within"
    : filters.joined_before_days
      ? "before"
      : "";
  const joinedDays =
    filters.joined_within_days ?? filters.joined_before_days ?? 7;

  function setJoined(mode: string, days: number) {
    const next = { ...filters };
    delete next.joined_within_days;
    delete next.joined_before_days;
    if (mode === "within") next.joined_within_days = days;
    if (mode === "before") next.joined_before_days = days;
    setFilters(next);
  }

  function setPeople(people: Person[]) {
    setPicked(people);
    const next = { ...filters };
    if (people.length === 0) delete next.profile_ids;
    else next.profile_ids = people.map((person) => person.id);
    setFilters(next);
  }

  function reset() {
    setPicked([]);
    setFilters({});
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
  const count = preview?.count ?? 0;
  const unreachable = Math.max(0, count - (preview?.reachable ?? 0));

  return (
    <form action={formAction} className="space-y-8">
      <input name="filters" type="hidden" value={JSON.stringify(filters)} />

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

        <div className="grid gap-4 sm:grid-cols-2">
          {CHOICE_FIELDS.map((field) => (
            <div className="space-y-1.5" key={field.key}>
              <Label htmlFor={field.key}>{field.label}</Label>
              <select
                className={SELECT_CLASS}
                id={field.key}
                onChange={(event) =>
                  setFilters(withChoice(filters, field.key, event.target.value))
                }
                value={choiceValue(filters, field.key)}
              >
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {field.hint ? (
                <p className="text-xs text-muted-foreground/70">{field.hint}</p>
              ) : null}
            </div>
          ))}

          <div className="space-y-1.5">
            <Label htmlFor="activity">Last opened the app</Label>
            <div className="flex gap-2">
              <select
                className={SELECT_CLASS}
                id="activity"
                onChange={(event) =>
                  setActivity(event.target.value, activityDays)
                }
                value={activityMode}
              >
                <option value="">Any</option>
                <option value="inactive">Not in the last…</option>
                <option value="active">Within the last…</option>
              </select>
              <Input
                aria-label="Days"
                className="w-24"
                disabled={activityMode === ""}
                max={3650}
                min={1}
                onChange={(event) =>
                  setActivity(activityMode, Number(event.target.value) || 1)
                }
                type="number"
                value={activityDays}
              />
            </div>
            <p className="text-xs text-muted-foreground/70">
              Someone who signed up and never came back counts as inactive
              since the day they joined.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="joined">Joined</Label>
            <div className="flex gap-2">
              <select
                className={SELECT_CLASS}
                id="joined"
                onChange={(event) => setJoined(event.target.value, joinedDays)}
                value={joinedMode}
              >
                <option value="">Any</option>
                <option value="within">Within the last…</option>
                <option value="before">More than … ago</option>
              </select>
              <Input
                aria-label="Days"
                className="w-24"
                disabled={joinedMode === ""}
                max={3650}
                min={1}
                onChange={(event) =>
                  setJoined(joinedMode, Number(event.target.value) || 1)
                }
                type="number"
                value={joinedDays}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="school">School contains</Label>
            <Input
              id="school"
              onChange={(event) => {
                const value = event.target.value;
                const next = { ...filters };
                if (value.trim().length < 2) delete next.school;
                else next.school = value.trim();
                setFilters(next);
              }}
              placeholder="e.g. Unilag"
              value={filters.school ?? ""}
            />
          </div>
        </div>

        <PeoplePicker onChange={setPeople} picked={picked} />

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

        <AudienceCount
          count={count}
          failed={previewFailed}
          loading={previewing}
          sample={preview?.sample ?? []}
          summary={summary}
          totalUsers={totalUsers}
          unreachable={unreachable}
        />
      </section>

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
          <select className={SELECT_CLASS} defaultValue="/notifications" id="url" name="url">
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
            {count === 1 ? "person" : "people"} ({summary.join(" · ")}) and
            cannot be unsent.
          </span>
        </label>

        {state.error ? (
          <p className="text-sm text-red-400">{state.error}</p>
        ) : null}

        <Button disabled={pending || previewFailed || count === 0} type="submit">
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
 * The number, and enough context to tell a good number from a wrong one.
 *
 * A bare count is easy to misread: 4,812 looks fine whether it means
 * "every Hustler" or "everybody, because a filter did not apply". The
 * share of the whole user base and a few of the names it selected are
 * what turn it into something checkable in a couple of seconds.
 */
function AudienceCount({
  count,
  failed,
  loading,
  sample,
  summary,
  totalUsers,
  unreachable,
}: {
  count: number;
  failed: boolean;
  loading: boolean;
  sample: { id: string; name: string }[];
  summary: string[];
  totalUsers: number;
  unreachable: number;
}) {
  const share =
    totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;

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

      <p className="mt-1 text-sm text-muted-foreground">{summary.join(" · ")}</p>

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

/** Search by name and pin specific people into the audience. */
function PeoplePicker({
  onChange,
  picked,
}: {
  onChange: (people: Person[]) => void;
  picked: Person[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Person[]>([]);

  const term = query.trim();

  // Results are hidden rather than cleared when the box empties: clearing
  // them would mean writing state from the effect body, and the stale set
  // is unreachable anyway, since nothing renders it below two characters.
  useEffect(() => {
    if (term.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      searchBroadcastRecipients(term)
        .then((rows) => {
          if (!cancelled) setResults(rows);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term]);

  return (
    <div className="space-y-2">
      <Label htmlFor="people">Specific people (optional)</Label>
      <Input
        autoComplete="off"
        id="people"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by name"
        value={query}
      />

      {term.length >= 2 && results.length > 0 ? (
        <ul className="rounded-lg border border-white/10 text-sm">
          {results.map((person) => {
            const already = picked.some((one) => one.id === person.id);
            return (
              <li
                className="flex items-center justify-between border-b border-white/5 px-3 py-2 last:border-0"
                key={person.id}
              >
                <span>
                  {person.name}
                  {person.school ? (
                    <span className="text-muted-foreground">
                      {" "}
                      · {person.school}
                    </span>
                  ) : null}
                </span>
                <button
                  className="text-xs text-accent disabled:text-muted-foreground"
                  disabled={already}
                  onClick={() => {
                    onChange([...picked, person]);
                    setQuery("");
                    setResults([]);
                  }}
                  type="button"
                >
                  {already ? "Added" : "Add"}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {picked.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {picked.map((person) => (
            <span
              className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs"
              key={person.id}
            >
              {person.name}
              <button
                className="text-muted-foreground hover:text-white"
                onClick={() =>
                  onChange(picked.filter((one) => one.id !== person.id))
                }
                type="button"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground/70">
        Names narrow the audience like every other filter rather than
        replacing it, so a pick that contradicts the filters above previews
        as nobody instead of quietly overriding them.
      </p>
    </div>
  );
}
