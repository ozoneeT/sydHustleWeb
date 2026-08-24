"use client";

import { useEffect, useState } from "react";

import { searchBroadcastRecipients } from "@/lib/console/actions";
import {
  CHOICE_FIELDS,
  choiceValue,
  withChoice,
  type AudienceFilters,
} from "@/lib/console/audience";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SELECT_CLASS =
  "h-10 w-full rounded-lg border border-white/10 bg-transparent px-3 text-sm";

export type Person = { id: string; name: string; school: string | null };

/**
 * The filter builder, shared by every surface that targets people.
 *
 * It exists as one component for the same reason the database has one
 * predicate: an operator who reads "Has a Skill listed" on the broadcast
 * page and on the promo page is entitled to assume both mean the same
 * thing. Two copies of this markup would be two sets of labels free to
 * drift apart from each other and from the SQL.
 *
 * `idPrefix` keeps two instances on one page (a target set and an exempt
 * set) from sharing input ids and stealing each other's label clicks.
 */
export function AudienceFields({
  idPrefix,
  onChange,
  people,
  onPeopleChange,
  value,
  withPeople = false,
  withReachable = true,
}: {
  idPrefix: string;
  onChange: (filters: AudienceFilters) => void;
  people?: Person[];
  onPeopleChange?: (people: Person[]) => void;
  value: AudienceFilters;
  withPeople?: boolean;
  /** Push reachability means nothing to a banner, which is drawn in a
   * feed the person is already looking at. */
  withReachable?: boolean;
}) {
  const fields = withReachable
    ? CHOICE_FIELDS
    : CHOICE_FIELDS.filter((field) => field.key !== "reachable");

  const activityMode = value.inactive_days
    ? "inactive"
    : value.active_within_days
      ? "active"
      : "";
  const activityDays = value.inactive_days ?? value.active_within_days ?? 14;

  function setActivity(mode: string, days: number) {
    const next = { ...value };
    delete next.inactive_days;
    delete next.active_within_days;
    if (mode === "inactive") next.inactive_days = days;
    if (mode === "active") next.active_within_days = days;
    onChange(next);
  }

  const joinedMode = value.joined_within_days
    ? "within"
    : value.joined_before_days
      ? "before"
      : "";
  const joinedDays = value.joined_within_days ?? value.joined_before_days ?? 7;

  function setJoined(mode: string, days: number) {
    const next = { ...value };
    delete next.joined_within_days;
    delete next.joined_before_days;
    if (mode === "within") next.joined_within_days = days;
    if (mode === "before") next.joined_before_days = days;
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div className="space-y-1.5" key={field.key}>
            <Label htmlFor={`${idPrefix}-${field.key}`}>{field.label}</Label>
            <select
              className={SELECT_CLASS}
              id={`${idPrefix}-${field.key}`}
              onChange={(event) =>
                onChange(withChoice(value, field.key, event.target.value))
              }
              value={choiceValue(value, field.key)}
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
          <Label htmlFor={`${idPrefix}-activity`}>Last opened the app</Label>
          <div className="flex gap-2">
            <select
              className={SELECT_CLASS}
              id={`${idPrefix}-activity`}
              onChange={(event) => setActivity(event.target.value, activityDays)}
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
            Someone who signed up and never came back counts as inactive since
            the day they joined.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-joined`}>Joined</Label>
          <div className="flex gap-2">
            <select
              className={SELECT_CLASS}
              id={`${idPrefix}-joined`}
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
          <Label htmlFor={`${idPrefix}-school`}>School contains</Label>
          <Input
            id={`${idPrefix}-school`}
            onChange={(event) => {
              const text = event.target.value;
              const next = { ...value };
              if (text.trim().length < 2) delete next.school;
              else next.school = text.trim();
              onChange(next);
            }}
            placeholder="e.g. Unilag"
            value={value.school ?? ""}
          />
        </div>
      </div>

      {withPeople && people && onPeopleChange ? (
        <PeoplePicker
          idPrefix={idPrefix}
          onChange={onPeopleChange}
          picked={people}
        />
      ) : null}
    </div>
  );
}

/** Search by name and pin specific people into a filter set. */
export function PeoplePicker({
  idPrefix,
  onChange,
  picked,
}: {
  idPrefix: string;
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
      <Label htmlFor={`${idPrefix}-people`}>Specific people (optional)</Label>
      <Input
        autoComplete="off"
        id={`${idPrefix}-people`}
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
        Names narrow the set like every other filter rather than replacing it,
        so a pick that contradicts the filters above matches nobody instead of
        quietly overriding them.
      </p>
    </div>
  );
}
