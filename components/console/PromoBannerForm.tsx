"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deletePromoBanner,
  savePromoBanner,
  togglePromoBanner,
  type PromoActionState,
} from "@/lib/console/promo-actions";
import type { PromoBannerRow } from "@/lib/console/promos";

const INITIAL: PromoActionState = { error: null, done: false };

const field =
  "w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent/50";

/**
 * Create or edit one banner.
 *
 * The two kinds share a form and swap the middle of it, because they
 * share everything that actually matters — placement, order, schedule —
 * and differ only in where the content comes from.
 */
export function PromoBannerForm({ banner }: { banner?: PromoBannerRow }) {
  const [state, action, pending] = useActionState(savePromoBanner, INITIAL);
  const [kind, setKind] = useState<"custom" | "featured">(
    banner?.kind ?? "custom",
  );

  return (
    <form action={action} className="space-y-4">
      {banner ? <input name="id" type="hidden" value={banner.id} /> : null}
      <input name="kind" type="hidden" value={kind} />

      <div className="flex gap-2">
        <Button
          className="h-8 px-3 text-xs"
          onClick={() => setKind("custom")}
          type="button"
          variant={kind === "custom" ? "default" : "secondary"}
        >
          Custom content
        </Button>
        <Button
          className="h-8 px-3 text-xs"
          onClick={() => setKind("featured")}
          type="button"
          variant={kind === "featured" ? "default" : "secondary"}
        >
          Featured listings
        </Button>
      </div>

      {kind === "custom" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-muted-foreground">
            Eyebrow
            <input
              className={field}
              defaultValue={banner?.eyebrow ?? ""}
              maxLength={60}
              name="eyebrow"
              placeholder="NEVER MISS A BOOKING"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            Headline (required)
            <input
              className={field}
              defaultValue={banner?.title ?? ""}
              maxLength={120}
              name="title"
              placeholder="Get a text the moment someone books you"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground sm:col-span-2">
            Subtitle
            <input
              className={field}
              defaultValue={banner?.subtitle ?? ""}
              maxLength={200}
              name="subtitle"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground sm:col-span-2">
            Image URL — https only. Leave blank for the brand gradient.
            <input
              className={field}
              defaultValue={banner?.image_url ?? ""}
              name="image_url"
              placeholder="https://…"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-300">
            This banner shows live hustleBoost placements, and the app labels it{" "}
            <strong>PROMOTED</strong> because someone paid for them. Don&apos;t
            use it for house content that wasn&apos;t sold — the label would be
            claiming a commercial relationship that doesn&apos;t exist.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs text-muted-foreground">
              Headline
              <input
                className={field}
                defaultValue={banner?.title ?? ""}
                maxLength={120}
                name="title"
                placeholder="Boosted right now"
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              How many to show
              <Input
                defaultValue={banner?.featured_count ?? 6}
                max={20}
                min={1}
                name="featured_count"
                type="number"
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              Reshuffle every (minutes)
              <Input
                defaultValue={banner?.rotate_minutes ?? 20}
                max={1440}
                min={1}
                name="rotate_minutes"
                type="number"
              />
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            Drawn from whatever is boosted at the time. The shuffle is derived
            from the clock, so every phone sees the same set within a window and
            it changes on its own — no job to run, nothing to keep in sync.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs text-muted-foreground">
          Button label
          <input
            className={field}
            defaultValue={banner?.cta_label ?? ""}
            maxLength={40}
            name="cta_label"
            placeholder="Turn on SMS alerts"
          />
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          Button link — /screen or https://
          <input
            className={field}
            defaultValue={banner?.cta_url ?? ""}
            name="cta_url"
            placeholder="/sms-paywall"
          />
        </label>
      </div>

      <fieldset className="space-y-2 rounded-lg border border-white/10 p-3">
        <legend className="px-1 text-xs text-muted-foreground">
          Where it appears
        </legend>
        <div className="flex flex-wrap items-center gap-5">
          <label className="flex items-center gap-2 text-sm">
            <input
              defaultChecked={banner?.show_on_home ?? false}
              name="show_on_home"
              type="checkbox"
            />
            Home
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              defaultChecked={banner?.show_on_skills ?? true}
              name="show_on_skills"
              type="checkbox"
            />
            Skills
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              defaultChecked={banner?.is_active ?? true}
              name="is_active"
              type="checkbox"
            />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm">
            Order
            <Input
              className="h-8 w-20"
              defaultValue={banner?.sort_order ?? 100}
              max={999}
              min={1}
              name="sort_order"
              type="number"
            />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          Neither box ticked means it runs nowhere. Each surface shows the first
          two by order — a third stays here but never appears.
        </p>
      </fieldset>

      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={pending} type="submit">
          {pending ? "Saving…" : banner ? "Save changes" : "Create banner"}
        </Button>
        {state.error ? (
          <span className="text-xs text-red-400">{state.error}</span>
        ) : null}
        {state.done ? (
          <span className="text-xs text-emerald-400">Saved.</span>
        ) : null}
      </div>
    </form>
  );
}

/** Off without losing the copy — the thing you actually want at 2am. */
export function PromoToggle({ id, active }: { id: string; active: boolean }) {
  const [state, action, pending] = useActionState(togglePromoBanner, INITIAL);

  return (
    <form action={action}>
      <input name="id" type="hidden" value={id} />
      <input name="active" type="hidden" value={active ? "false" : "true"} />
      <Button
        className="h-8 px-3 text-xs"
        disabled={pending}
        type="submit"
        variant="secondary"
      >
        {pending ? "…" : active ? "Turn off" : "Turn on"}
      </Button>
      {state.error ? (
        <span className="ml-2 text-xs text-red-400">{state.error}</span>
      ) : null}
    </form>
  );
}

export function PromoDelete({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deletePromoBanner, INITIAL);
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <Button
        className="h-8 px-3 text-xs"
        onClick={() => setArmed(true)}
        type="button"
        variant="ghost"
      >
        Delete
      </Button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input name="id" type="hidden" value={id} />
      <Button
        className="h-8 border-red-500/40 px-3 text-xs text-red-400 hover:bg-red-500/10"
        disabled={pending}
        type="submit"
        variant="secondary"
      >
        {pending ? "Deleting…" : "Confirm"}
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
