"use client";

import { Fragment, useActionState, useMemo, useState } from "react";
import {
  Check,
  FolderInput,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  deleteSkill,
  moveListings,
  promoteRail,
  retireSkill,
  saveSkill,
  setFeaturedSkills,
  type MoveState,
  type SkillFormState,
} from "@/lib/console/skill-actions";
import type { ConsoleSkill, UncategorizedRail } from "@/lib/console/skills";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const initialState: SkillFormState = { error: null, saved: false };
const initialMove: MoveState = { error: null, message: null };

/** What the wizard will draw. Mirrors DEFAULT_SUGGESTION_LIMIT in the app. */
const MAX_FEATURED = 8;
/** Where the chips stop fitting on one row on a 360dp Android screen. */
const COMFORTABLE_FEATURED = 6;

function Notice({ state }: { state: SkillFormState }) {
  if (state.error) {
    return (
      <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
        {state.error}
      </p>
    );
  }
  if (state.saved) {
    return (
      <p className="flex items-center gap-1.5 text-sm text-emerald-400">
        <Check className="size-4" aria-hidden /> Saved — live in the app now.
      </p>
    );
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* The shortlist                                                       */
/* ------------------------------------------------------------------ */

/**
 * The five chips under the search box, as a list you can reorder.
 *
 * Drawn as the wizard draws them, in the wizard's order, because that is
 * the only way to judge the decision being made: a shortlist is about
 * what a student sees in the first second of Add a Skill, and reading it
 * as rows of a table tells you nothing about whether it wraps or whether
 * the first two are the two that matter.
 */
function FeaturedEditor({ skills }: { skills: ConsoleSkill[] }) {
  const [state, formAction, pending] = useActionState(
    setFeaturedSkills,
    initialState
  );
  const [chosen, setChosen] = useState<string[]>(() =>
    skills
      .filter((skill) => skill.featured_rank !== null)
      .sort((a, b) => (a.featured_rank ?? 0) - (b.featured_rank ?? 0))
      .map((skill) => skill.id)
  );
  const [query, setQuery] = useState("");

  const byId = useMemo(
    () => new Map(skills.map((skill) => [skill.id, skill])),
    [skills]
  );

  const addable = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return skills
      .filter((skill) => skill.retired_at === null && !chosen.includes(skill.id))
      .filter((skill) => !needle || skill.name.toLowerCase().includes(needle))
      .slice(0, 12);
  }, [skills, chosen, query]);

  const move = (index: number, by: number) =>
    setChosen((current) => {
      const next = [...current];
      const target = index + by;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="font-semibold">Suggested skills</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          The chips under the search box on step 1 of Add a Skill, before
          anybody types. Left to right is the order they appear in, and the
          first one is seen most. Everything else in the catalogue is still
          reachable — by search.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        {/* Roughly the wizard's own chip row, so the wrap is visible here
            rather than discovered on a phone. */}
        <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-4">
          <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
            How it will look
          </p>
          {chosen.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing chosen. The app falls back to the first five skills in
              search order — which is what it did before this page existed.
            </p>
          ) : (
            <div className="flex max-w-[380px] flex-wrap gap-2">
              {chosen.map((id) => (
                <span
                  key={id}
                  className="rounded-full border border-white/15 px-3 py-1.5 text-sm"
                >
                  {byId.get(id)?.name ?? id}
                </span>
              ))}
            </div>
          )}
        </div>

        <ol className="space-y-2">
          {chosen.map((id, index) => (
            <li
              key={id}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2"
            >
              <input name="featured" type="hidden" value={id} />
              <span className="w-5 text-xs text-muted-foreground">
                {index + 1}
              </span>
              <span className="flex-1 text-sm">
                {byId.get(id)?.name ?? id}
                <span className="ml-2 text-xs text-muted-foreground">
                  {byId.get(id)?.icon}
                </span>
              </span>
              <Button
                aria-label="Move up"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                size="sm"
                type="button"
                variant="ghost"
              >
                ↑
              </Button>
              <Button
                aria-label="Move down"
                disabled={index === chosen.length - 1}
                onClick={() => move(index, 1)}
                size="sm"
                type="button"
                variant="ghost"
              >
                ↓
              </Button>
              <Button
                aria-label={`Remove ${byId.get(id)?.name ?? id}`}
                onClick={() =>
                  setChosen((current) => current.filter((value) => value !== id))
                }
                size="sm"
                type="button"
                variant="ghost"
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ol>

        {chosen.length > COMFORTABLE_FEATURED ? (
          <p className="text-xs text-amber-300">
            {chosen.length} chips wrap onto a third row on a small Android
            screen, which pushes the rest of the step below the fold. Six is
            the comfortable maximum.
          </p>
        ) : null}

        {chosen.length < MAX_FEATURED ? (
          <div className="space-y-2 rounded-lg border border-white/10 p-3">
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                className="pl-8"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Add a skill to the shortlist"
                value={query}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {addable.map((skill) => (
                <Button
                  key={skill.id}
                  onClick={() => {
                    setChosen((current) => [...current, skill.id]);
                    setQuery("");
                  }}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  <Plus className="size-3.5" /> {skill.name}
                </Button>
              ))}
              {addable.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing matches — or everything that does is already on the
                  list.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <Notice state={state} />
        <Button disabled={pending} type="submit">
          {pending ? "Saving…" : "Save shortlist"}
        </Button>
      </form>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Adding                                                              */
/* ------------------------------------------------------------------ */

/**
 * A new skill, or a rename of one that exists.
 *
 * The icon is the hard part, and the only field with real rules behind
 * it: it must be an Ionicons OUTLINE name that exists in the font the
 * app bundles, and no two skills may wear the same one. So the picker
 * offers exactly the names that satisfy all three — nothing invented,
 * nothing filled, nothing taken — instead of letting somebody type a
 * plausible name and find out from a constraint.
 */
function SkillForm({
  editing,
  iconNames,
  onDone,
  taken,
}: {
  editing: ConsoleSkill | null;
  iconNames: readonly string[];
  onDone: () => void;
  taken: Set<string>;
}) {
  const [state, formAction, pending] = useActionState(saveSkill, initialState);
  const [icon, setIcon] = useState(editing?.icon ?? "");
  const [iconQuery, setIconQuery] = useState("");

  const free = useMemo(() => {
    const needle = iconQuery.trim().toLowerCase();
    return iconNames
      .filter((name) => !taken.has(name) || name === editing?.icon)
      .filter((name) => !needle || name.includes(needle))
      .slice(0, 40);
  }, [iconNames, taken, iconQuery, editing?.icon]);

  return (
    <form action={formAction} className="space-y-4">
      <input name="id" type="hidden" value={editing?.id ?? ""} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          <span className="font-medium">Name</span>
          <Input
            defaultValue={editing?.name ?? ""}
            name="name"
            placeholder="Phone Repair"
            required
          />
          <span className="block text-xs text-muted-foreground">
            Singular, as one person would describe what they do.
          </span>
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="font-medium">Plural</span>
          <Input
            defaultValue={editing?.name_plural ?? ""}
            name="name_plural"
            placeholder="Phone Repairers"
          />
          <span className="block text-xs text-muted-foreground">
            The Skills feed&apos;s heading for this rail. Left blank, it
            reuses the name.
          </span>
        </label>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Icon</span>
        <input name="icon" type="hidden" value={icon} />
        <Input
          onChange={(event) => setIconQuery(event.target.value)}
          placeholder="Search icons — “phone”, “car”, “cut”…"
          value={iconQuery}
        />
        <p className="text-xs text-muted-foreground">
          Outline glyphs only, and every skill needs its own — the wizard
          tells them apart by icon as much as by name. Taken ones are not
          offered.
        </p>
        <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-white/10 p-2">
          {free.map((name) => (
            <button
              className={`rounded-md px-2 py-1 text-xs transition-colors ${
                icon === name
                  ? "bg-emerald-500/20 text-emerald-200"
                  : "text-muted-foreground hover:bg-white/5"
              }`}
              key={name}
              onClick={() => setIcon(name)}
              type="button"
            >
              {name}
            </button>
          ))}
          {free.length === 0 ? (
            <p className="p-1 text-xs text-muted-foreground">
              No free icon matches that.
            </p>
          ) : null}
        </div>
        {icon ? (
          <p className="text-xs">
            Chosen: <span className="font-medium">{icon}</span>
          </p>
        ) : null}
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input
          className="mt-1"
          defaultChecked={editing?.licensed_trade ?? false}
          name="licensed_trade"
          type="checkbox"
        />
        <span>
          <span className="font-medium">Licensed trade</span>
          <span className="block text-xs text-muted-foreground">
            Adds &ldquo;Are you licensed?&rdquo; to the wizard. Only for work
            where the question means something — electrician, driving
            instructor — not as a general trust signal.
          </span>
        </span>
      </label>

      <Notice state={state} />
      <div className="flex gap-2">
        <Button disabled={pending || !icon} type="submit">
          {pending ? "Saving…" : editing ? "Save changes" : "Add skill"}
        </Button>
        <Button onClick={onDone} type="button" variant="ghost">
          {state.saved ? "Done" : "Cancel"}
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Removing                                                            */
/* ------------------------------------------------------------------ */

function RowActions({
  editing,
  onEdit,
  skill,
  skills,
}: {
  editing: boolean;
  onEdit: () => void;
  skill: ConsoleSkill;
  skills: ConsoleSkill[];
}) {
  const [retireState, retireAction, retiring] = useActionState(
    retireSkill,
    initialState
  );
  const [deleteState, deleteAction, deleting] = useActionState(
    deleteSkill,
    initialState
  );
  const [moveState, moveAction, moving] = useActionState(
    moveListings,
    initialMove
  );
  const [confirming, setConfirming] = useState(false);
  const [emptying, setEmptying] = useState(false);
  const [target, setTarget] = useState("");
  const [targetQuery, setTargetQuery] = useState("");
  const deletable = skill.listing_count === 0;

  const targets = skills
    .filter((other) => other.id !== skill.id && other.retired_at === null)
    .filter(
      (other) =>
        !targetQuery.trim() ||
        other.name.toLowerCase().includes(targetQuery.trim().toLowerCase())
    )
    .slice(0, 24);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap justify-end gap-1.5">
        <Button
          onClick={onEdit}
          size="sm"
          type="button"
          variant={editing ? "secondary" : "ghost"}
        >
          <Pencil className="size-3.5" /> {editing ? "Close" : "Edit"}
        </Button>
        <form action={retireAction}>
          <input name="id" type="hidden" value={skill.id} />
          <input
            name="retired"
            type="hidden"
            value={skill.retired_at ? "false" : "true"}
          />
          <Button disabled={retiring} size="sm" type="submit" variant="secondary">
            {skill.retired_at ? (
              <>
                <RotateCcw className="size-3.5" /> Bring back
              </>
            ) : (
              "Retire"
            )}
          </Button>
        </form>

        {/* Offered only where it costs nothing. The database refuses it
            anyway; hiding the button means the refusal is not the way an
            operator learns what retire is for. */}
        {deletable ? (
          <Button
            onClick={() => setConfirming((value) => !value)}
            size="sm"
            type="button"
            variant="ghost"
          >
            <Trash2 className="size-3.5" />
          </Button>
        ) : (
          /* The way OUT of "can't delete this". Move the listings
             somewhere they belong and the trash appears on the next
             render, because the count is then zero. */
          <Button
            onClick={() => setEmptying((value) => !value)}
            size="sm"
            type="button"
            variant={emptying ? "secondary" : "ghost"}
          >
            <FolderInput className="size-3.5" /> Move listings
          </Button>
        )}
      </div>

      {emptying && !deletable ? (
        <form action={moveAction} className="space-y-2">
          <input name="rail_id" type="hidden" value={skill.id} />
          <input name="skill_id" type="hidden" value={target} />
          <p className="text-right text-xs text-muted-foreground">
            Where should its {skill.listing_count.toLocaleString("en-NG")}{" "}
            {skill.listing_count === 1 ? "listing" : "listings"} go?
          </p>
          <Input
            className="h-8 text-xs"
            onChange={(event) => setTargetQuery(event.target.value)}
            placeholder="Search the catalogue"
            value={targetQuery}
          />
          <div className="flex max-h-28 flex-wrap justify-end gap-1.5 overflow-y-auto">
            {targets.map((other) => (
              <button
                className={`rounded-md px-2 py-1 text-xs transition-colors ${
                  target === other.id
                    ? "bg-emerald-500/20 text-emerald-200"
                    : "text-muted-foreground hover:bg-white/5"
                }`}
                key={other.id}
                onClick={() => setTarget(other.id)}
                type="button"
              >
                {other.name}
              </button>
            ))}
          </div>
          <MoveNotice state={moveState} />
          <Button disabled={moving || !target} size="sm" type="submit">
            {moving ? "Moving…" : "Move them"}
          </Button>
        </form>
      ) : null}

      {confirming && deletable ? (
        <form action={deleteAction} className="space-y-2 text-right">
          <input name="id" type="hidden" value={skill.id} />
          {/* The name is NOT posted — the action reads it back from the
              catalogue and compares there, so the confirmation cannot be
              satisfied by whatever this page happened to render. */}
          <Input
            className="h-8 text-xs"
            name="confirm"
            placeholder={`Type “${skill.name}” to delete`}
          />
          <Button disabled={deleting} size="sm" type="submit" variant="secondary">
            {deleting ? "Deleting…" : "Delete for good"}
          </Button>
        </form>
      ) : null}

      {retireState.error ? (
        <p className="text-right text-xs text-red-300">{retireState.error}</p>
      ) : null}
      {deleteState.error ? (
        <p className="text-right text-xs text-red-300">{deleteState.error}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Uncategorised rails                                                 */
/* ------------------------------------------------------------------ */

function MoveNotice({ state }: { state: MoveState }) {
  if (state.error) {
    return (
      <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
        {state.error}
      </p>
    );
  }
  if (state.message) {
    return (
      <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
        {state.message}
      </p>
    );
  }
  return null;
}

/**
 * One typed rail, and the two things worth doing with it.
 *
 * File it under a catalogue skill that already covers it, or promote it
 * into a catalogue skill of its own. Both leave the Hustler's own
 * wording on the card untouched — see the migration header for why the
 * rail is the category and the name is the trade.
 */
function RailRow({
  iconNames,
  rail,
  skills,
  taken,
}: {
  iconNames: readonly string[];
  rail: UncategorizedRail;
  skills: ConsoleSkill[];
  taken: Set<string>;
}) {
  const [moveState, moveAction, moving] = useActionState(
    moveListings,
    initialMove
  );
  const [promoteState, promoteAction, promoting] = useActionState(
    promoteRail,
    initialMove
  );
  const [mode, setMode] = useState<"idle" | "move" | "promote">("idle");
  const [target, setTarget] = useState("");
  const [icon, setIcon] = useState("");
  const [iconQuery, setIconQuery] = useState("");

  const free = useMemo(() => {
    const needle = iconQuery.trim().toLowerCase();
    return iconNames
      .filter((name) => !taken.has(name))
      .filter((name) => !needle || name.includes(needle))
      .slice(0, 40);
  }, [iconNames, taken, iconQuery]);

  const live = skills.filter((skill) => skill.retired_at === null);

  return (
    <li className="space-y-3 rounded-xl border border-white/10 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{rail.display_name}</p>
          <p className="text-xs text-muted-foreground">
            {rail.listing_count.toLocaleString("en-NG")}{" "}
            {rail.listing_count === 1 ? "listing" : "listings"}
            {rail.owned_count > 0
              ? ` · ${rail.owned_count} from a real account`
              : " · demo listings only"}
            {rail.certified_count > 0
              ? ` · ${rail.certified_count} certified (cannot be moved)`
              : ""}
          </p>
        </div>
        <div className="flex gap-1.5">
          <Button
            onClick={() => setMode(mode === "move" ? "idle" : "move")}
            size="sm"
            type="button"
            variant={mode === "move" ? "secondary" : "ghost"}
          >
            <FolderInput className="size-3.5" /> File under…
          </Button>
          <Button
            onClick={() => setMode(mode === "promote" ? "idle" : "promote")}
            size="sm"
            type="button"
            variant={mode === "promote" ? "secondary" : "ghost"}
          >
            <Plus className="size-3.5" /> Make it a skill
          </Button>
        </div>
      </div>

      {mode === "move" ? (
        <form action={moveAction} className="space-y-2">
          <input name="rail_id" type="hidden" value={rail.rail_id} />
          <input name="skill_id" type="hidden" value={target} />
          <Input
            onChange={(event) => setIconQuery(event.target.value)}
            placeholder="Search the catalogue for where this belongs"
            value={iconQuery}
          />
          <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
            {live
              .filter(
                (skill) =>
                  !iconQuery.trim() ||
                  skill.name.toLowerCase().includes(iconQuery.trim().toLowerCase())
              )
              .slice(0, 24)
              .map((skill) => (
                <button
                  className={`rounded-md px-2 py-1 text-xs transition-colors ${
                    target === skill.id
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "text-muted-foreground hover:bg-white/5"
                  }`}
                  key={skill.id}
                  onClick={() => setTarget(skill.id)}
                  type="button"
                >
                  {skill.name}
                </button>
              ))}
          </div>
          <MoveNotice state={moveState} />
          <Button disabled={moving || !target} size="sm" type="submit">
            {moving ? "Moving…" : "Move these listings"}
          </Button>
        </form>
      ) : null}

      {mode === "promote" ? (
        <form action={promoteAction} className="space-y-3">
          <input name="rail_id" type="hidden" value={rail.rail_id} />
          <input name="icon" type="hidden" value={icon} />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              defaultValue={rail.display_name}
              name="name"
              placeholder="Name"
              required
            />
            <Input name="name_plural" placeholder="Plural (optional)" />
          </div>
          <Input
            onChange={(event) => setIconQuery(event.target.value)}
            placeholder="Search icons"
            value={iconQuery}
          />
          <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-white/10 p-2">
            {free.map((name) => (
              <button
                className={`rounded-md px-2 py-1 text-xs transition-colors ${
                  icon === name
                    ? "bg-emerald-500/20 text-emerald-200"
                    : "text-muted-foreground hover:bg-white/5"
                }`}
                key={name}
                onClick={() => setIcon(name)}
                type="button"
              >
                {name}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input name="licensed_trade" type="checkbox" />
            Licensed trade
          </label>
          <MoveNotice state={promoteState} />
          <Button disabled={promoting || !icon} size="sm" type="submit">
            {promoting ? "Adding…" : "Add to catalogue and file these here"}
          </Button>
        </form>
      ) : null}
    </li>
  );
}

function UncategorizedCard({
  iconNames,
  rails,
  skills,
  taken,
}: {
  iconNames: readonly string[];
  rails: UncategorizedRail[];
  skills: ConsoleSkill[];
  taken: Set<string>;
}) {
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rails;
    return rails.filter((rail) =>
      rail.display_name.toLowerCase().includes(needle)
    );
  }, [rails, query]);

  const owned = rails.filter((rail) => rail.owned_count > 0).length;

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="font-semibold">Uncategorised</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Trades a Hustler typed instead of picking. Each one is its own
          rail on the Skills feed with nothing in the catalogue behind it,
          which is why searching here for a skill you have seen in the app
          can come back empty. {rails.length} of them,{" "}
          {owned > 0
            ? `${owned} with a listing from a real account`
            : "all from the seeded demo listings"}
          .
        </p>
      </div>

      {rails.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing uncategorised — every listing sits under a catalogue skill.
        </p>
      ) : (
        <>
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              className="pl-8"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search typed skills"
              value={query}
            />
          </div>
          <ul className="space-y-2">
            {shown.map((rail) => (
              <RailRow
                iconNames={iconNames}
                key={rail.rail_id}
                rail={rail}
                skills={skills}
                taken={taken}
              />
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* The page                                                            */
/* ------------------------------------------------------------------ */

export function SkillCatalog({
  iconNames,
  rails,
  skills,
}: {
  iconNames: readonly string[];
  rails: UncategorizedRail[];
  skills: ConsoleSkill[];
}) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ConsoleSkill | null>(null);
  const [adding, setAdding] = useState(false);

  /**
   * The skill name and the row's Edit button are two affordances for one
   * action, so the toggle lives here rather than being written twice and
   * drifting. Opening an editor always closes the add form: two open
   * forms writing to the same catalogue is a way to lose an edit.
   */
  const toggleEdit = (skill: ConsoleSkill) => {
    setAdding(false);
    setEditing((current) => (current?.id === skill.id ? null : skill));
  };

  const taken = useMemo(
    () => new Set(skills.map((skill) => skill.icon)),
    [skills]
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return skills;
    return skills.filter(
      (skill) =>
        skill.name.toLowerCase().includes(needle) ||
        skill.id.includes(needle) ||
        skill.icon.includes(needle)
    );
  }, [skills, query]);

  const live = skills.filter((skill) => skill.retired_at === null).length;

  return (
    <div className="space-y-8">
      <FeaturedEditor skills={skills} />

      <UncategorizedCard
        iconNames={iconNames}
        rails={rails}
        skills={skills}
        taken={taken}
      />

      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">The catalogue</h2>
            <p className="text-sm text-muted-foreground">
              {live} skills anyone can pick, {skills.length - live} retired.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setAdding((value) => !value);
            }}
            type="button"
            variant={adding ? "ghost" : "default"}
          >
            {adding ? "Cancel" : (
              <>
                <Plus className="size-4" /> Add a skill
              </>
            )}
          </Button>
        </div>

        {adding ? (
          <div className="rounded-xl border border-white/10 p-4">
            <SkillForm
              editing={null}
              iconNames={iconNames}
              onDone={() => setAdding(false)}
              taken={taken}
            />
          </div>
        ) : null}

        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            className="pl-8"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the catalogue"
            value={query}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2">Skill</th>
                <th className="py-2">Icon</th>
                <th className="py-2 text-right">Listings</th>
                <th className="py-2">State</th>
                <th className="py-2 sr-only">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((skill) => (
                <tr
                  className="border-b border-white/5 align-top"
                  key={skill.id}
                >
                  <td className="py-2.5">
                    <button
                      className="text-left font-medium hover:underline"
                      onClick={() => toggleEdit(skill)}
                      type="button"
                    >
                      {skill.name}
                    </button>
                    <span className="block text-xs text-muted-foreground">
                      {skill.name_plural}
                      {skill.licensed_trade ? " · licensed trade" : ""}
                    </span>
                    {editing?.id === skill.id ? (
                      <div className="mt-3 rounded-xl border border-white/10 p-4">
                        <SkillForm
                          editing={skill}
                          iconNames={iconNames}
                          onDone={() => setEditing(null)}
                          taken={taken}
                        />
                      </div>
                    ) : null}
                  </td>
                  <td className="py-2.5 text-xs text-muted-foreground">
                    {skill.icon}
                  </td>
                  <td className="py-2.5 text-right tabular-nums">
                    {skill.listing_count.toLocaleString("en-NG")}
                  </td>
                  <td className="py-2.5">
                    {skill.featured_rank !== null ? (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
                        Suggested #{skill.featured_rank}
                      </span>
                    ) : skill.retired_at ? (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-muted-foreground">
                        Retired
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Searchable
                      </span>
                    )}
                  </td>
                  <td className="py-2.5">
                    <RowActions
                      editing={editing?.id === skill.id}
                      onEdit={() => toggleEdit(skill)}
                      skill={skill}
                      skills={skills}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
