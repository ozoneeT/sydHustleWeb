"use client";

import { useActionState, useState } from "react";

import { PromoPreview } from "@/components/console/PromoPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_ROUTE_PATHS, PROMO_SURFACES } from "@/lib/console/app-routes";
import {
  deletePromoBanner,
  savePromoBanner,
  togglePromoBanner,
  uploadPromoArt,
  type PromoActionState,
  type PromoUploadState,
} from "@/lib/console/promo-actions";
import type { PromoBannerRow } from "@/lib/console/promos";

const INITIAL: PromoActionState = { error: null, done: false };
const UPLOAD_INITIAL: PromoUploadState = { error: null, url: null };

const field =
  "w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent/50";
const labelClass = "space-y-1 text-xs text-muted-foreground";

/**
 * Create or edit one banner, with a live preview.
 *
 * Everything the preview draws is controlled state rather than an
 * uncontrolled input, because the whole point is that the picture
 * follows the typing. Everything it does NOT draw — placement,
 * schedule, the featured settings — stays uncontrolled, since making
 * the entire form controlled would be a lot of re-rendering to show
 * nothing new.
 */
export function PromoBannerForm({ banner }: { banner?: PromoBannerRow }) {
  const [state, action, pending] = useActionState(savePromoBanner, INITIAL);

  const [kind, setKind] = useState<"custom" | "featured">(
    banner?.kind ?? "custom",
  );
  const [eyebrow, setEyebrow] = useState(banner?.eyebrow ?? "");
  const [title, setTitle] = useState(banner?.title ?? "");
  const [subtitle, setSubtitle] = useState(banner?.subtitle ?? "");
  const [ctaLabel, setCtaLabel] = useState(banner?.cta_label ?? "");
  const [imageUrl, setImageUrl] = useState(banner?.image_url ?? "");

  const [imageMode, setImageMode] = useState<"background" | "side" | "none">(
    banner?.image_mode ?? "background",
  );
  const [imageSide, setImageSide] = useState<"left" | "right">(
    banner?.image_side ?? "right",
  );
  const [imageScale, setImageScale] = useState(
    Number(banner?.image_scale ?? 0.36),
  );
  const [height, setHeight] = useState(banner?.height ?? 150);
  const [widthPct, setWidthPct] = useState(banner?.width_pct ?? 100);
  const [backgroundMode, setBackgroundMode] = useState<"solid" | "gradient">(
    banner?.background_mode ?? "gradient",
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <form action={action} className="space-y-4">
        {banner ? <input name="id" type="hidden" value={banner.id} /> : null}
        <input name="kind" type="hidden" value={kind} />
        <input name="image_url" type="hidden" value={imageUrl} />
        <input name="image_mode" type="hidden" value={imageMode} />
        <input name="image_side" type="hidden" value={imageSide} />
        <input name="image_scale" type="hidden" value={imageScale} />
        <input name="background_mode" type="hidden" value={backgroundMode} />

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

        {kind === "featured" ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-300">
            This banner shows live hustleBoost placements, and the app labels it{" "}
            <strong>PROMOTED</strong> because someone paid for them. Don&apos;t
            use it for house content that wasn&apos;t sold — the label would be
            claiming a commercial relationship that doesn&apos;t exist.
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          {kind === "custom" ? (
            <label className={labelClass}>
              Eyebrow
              <input
                className={field}
                maxLength={60}
                name="eyebrow"
                onChange={(e) => setEyebrow(e.target.value)}
                placeholder="NEVER MISS A BOOKING"
                value={eyebrow}
              />
            </label>
          ) : null}
          <label className={labelClass}>
            Headline{kind === "custom" ? " (required)" : ""}
            <input
              className={field}
              maxLength={120}
              name="title"
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Get a text the moment someone books you"
              value={title}
            />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Subtitle
            <input
              className={field}
              maxLength={200}
              name="subtitle"
              onChange={(e) => setSubtitle(e.target.value)}
              value={subtitle}
            />
          </label>
        </div>

        {kind === "featured" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              How many to show
              <Input
                defaultValue={banner?.featured_count ?? 6}
                max={20}
                min={1}
                name="featured_count"
                type="number"
              />
            </label>
            <label className={labelClass}>
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
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            Button label
            <input
              className={field}
              maxLength={40}
              name="cta_label"
              onChange={(e) => setCtaLabel(e.target.value)}
              placeholder="Turn on SMS alerts"
              value={ctaLabel}
            />
          </label>
          <label className={labelClass}>
            Button link — /screen or https://
            <input
              className={field}
              defaultValue={banner?.cta_url ?? ""}
              list="app-routes"
              name="cta_url"
              placeholder="/sms-paywall"
            />
            <datalist id="app-routes">
              {APP_ROUTE_PATHS.map((path) => (
                <option key={path} value={path} />
              ))}
            </datalist>
          </label>
        </div>

        <ArtPicker onChange={setImageUrl} value={imageUrl} />

        <fieldset className="space-y-3 rounded-lg border border-white/10 p-3">
          <legend className="px-1 text-xs text-muted-foreground">Layout</legend>

          <Choice
            label="Artwork"
            onChange={(v) => setImageMode(v as typeof imageMode)}
            options={[
              { value: "background", label: "Fills the card" },
              { value: "side", label: "Beside the copy" },
              { value: "none", label: "No image" },
            ]}
            value={imageMode}
          />

          {imageMode === "side" ? (
            <>
              <Choice
                label="Side"
                onChange={(v) => setImageSide(v as typeof imageSide)}
                options={[
                  { value: "left", label: "Left" },
                  { value: "right", label: "Right" },
                ]}
                value={imageSide}
              />
              {/* Percent in the UI, fraction in the column — the
                  conversion lives here so nothing downstream deals in
                  0.36. */}
              <Slider
                label="Image width"
                max={60}
                min={15}
                onChange={(next) => setImageScale(next / 100)}
                unit="%"
                value={Math.round(imageScale * 100)}
              />
            </>
          ) : null}

          {imageMode !== "background" ? (
            <Choice
              label="Background"
              onChange={(v) => setBackgroundMode(v as typeof backgroundMode)}
              options={[
                { value: "gradient", label: "Gradient" },
                { value: "solid", label: "Solid" },
              ]}
              value={backgroundMode}
            />
          ) : null}

          <Slider
            label="Card height"
            max={320}
            min={90}
            name="height"
            onChange={setHeight}
            step={2}
            unit="pt"
            value={height}
          />
          <Slider
            label="Card width"
            max={100}
            min={60}
            name="width_pct"
            onChange={setWidthPct}
            unit="%"
            value={widthPct}
          />
        </fieldset>

        <fieldset className="space-y-2 rounded-lg border border-white/10 p-3">
          <legend className="px-1 text-xs text-muted-foreground">
            Where it appears
          </legend>
          <div className="flex flex-wrap items-center gap-5">
            {PROMO_SURFACES.map((surface) => (
              <label
                className="flex items-center gap-2 text-sm"
                key={surface.field}
              >
                <input
                  defaultChecked={
                    banner ? banner[surface.field] : surface.defaultOn
                  }
                  name={surface.field}
                  type="checkbox"
                />
                {surface.label}
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-5 border-t border-white/5 pt-3">
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
            Nothing ticked means it runs nowhere. Each surface shows the first
            two by order — a third stays here but never appears. Hustles, Wallet
            and Messages start off: Messages is a private conversation list, and
            an advert landing there should be a deliberate act.
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

      <div className="space-y-2 lg:sticky lg:top-4 lg:self-start">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Preview
        </p>
        <PromoPreview
          values={{
            eyebrow,
            title,
            subtitle,
            imageUrl,
            ctaLabel,
            isPaid: kind === "featured",
            imageMode,
            imageSide,
            imageScale,
            height,
            widthPct,
            backgroundMode,
          }}
        />
        <p className="text-xs text-muted-foreground">
          Drawn at a phone&apos;s real proportions. A <strong>featured</strong>{" "}
          banner also shows a strip of the boosted listings underneath, which
          can&apos;t be previewed here because the set is picked at the moment
          it&apos;s shown.
        </p>
      </div>
    </div>
  );
}

/** A labelled row of mutually exclusive buttons. */
function Choice({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-24 shrink-0 text-xs text-muted-foreground">
        {label}
      </span>
      {options.map((option) => (
        <Button
          className="h-7 px-2.5 text-xs"
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
          variant={value === option.value ? "default" : "secondary"}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  name,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  /** Present when the value posts directly under this name. */
  name?: string;
  onChange: (value: number) => void;
}) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="w-24 shrink-0 text-xs text-muted-foreground">
        {label}
      </span>

      {/*
        No `appearance-none` here, deliberately. It strips a range
        input's thumb entirely, and Tailwind's `accent-*` only colours a
        control whose native appearance is intact — together they render
        a bare track with nothing to grab, which reads as a slider that
        has stopped updating rather than one that was never draggable.
        Native appearance plus `accent-color` gets a brand-tinted thumb
        that works in every browser.
      */}
      <input
        className="min-w-[9rem] flex-1 cursor-pointer accent-accent"
        max={max}
        min={min}
        onChange={(event) => onChange(clamp(Number(event.target.value)))}
        step={step}
        type="range"
        value={value}
      />

      {/* Typed as well as dragged: a slider is quick and imprecise, and
          sometimes you know you want exactly 200. */}
      <input
        className="w-16 shrink-0 rounded-md border border-white/10 bg-transparent px-2 py-1 text-right text-xs tabular-nums outline-none focus:border-accent/50"
        max={max}
        min={min}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) onChange(clamp(next));
        }}
        step={step}
        type="number"
        value={value}
      />
      <span className="w-6 shrink-0 text-xs text-muted-foreground">{unit}</span>

      {/* Posts from here rather than from either control, so the pair
          reads as one field to the form. */}
      {name ? <input name={name} type="hidden" value={value} /> : null}
    </div>
  );
}

/**
 * Artwork: upload from this machine, or paste a URL.
 *
 * The upload is its own action rather than part of the save, because a
 * file and a form submit have different failure modes — an image that
 * is too large should not also lose the copy someone just typed. It
 * uploads, hands back a public URL, and lifts it into the parent's
 * state so the preview updates with it.
 */
function ArtPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [state, action, pending] = useActionState(
    uploadPromoArt,
    UPLOAD_INITIAL,
  );
  const [lastUploaded, setLastUploaded] = useState<string | null>(null);

  // Lift a finished upload into the parent once, during render rather
  // than in an effect — writing state during render is allowed when
  // it's derived from a prop/result change and guarded against
  // repeating, which `lastUploaded` does.
  if (state.url && state.url !== lastUploaded) {
    setLastUploaded(state.url);
    onChange(state.url);
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Artwork — optional. A transparent PNG works well beside the copy.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt="Banner artwork"
            className="h-16 w-28 rounded-lg object-contain"
            src={value}
          />
        ) : (
          <div className="flex h-16 w-28 items-center justify-center rounded-lg border border-dashed border-white/15 text-xs text-muted-foreground">
            No image
          </div>
        )}

        <div className="space-y-2">
          <input
            accept="image/jpeg,image/png,image/webp"
            className="block text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:text-foreground"
            form="promo-art-upload"
            name="file"
            type="file"
          />
          <div className="flex items-center gap-2">
            <Button
              className="h-8 px-3 text-xs"
              disabled={pending}
              form="promo-art-upload"
              type="submit"
              variant="secondary"
            >
              {pending ? "Uploading…" : "Upload"}
            </Button>
            {value ? (
              <Button
                className="h-8 px-2 text-xs"
                onClick={() => onChange("")}
                type="button"
                variant="ghost"
              >
                Remove
              </Button>
            ) : null}
            {state.error ? (
              <span className="text-xs text-red-400">{state.error}</span>
            ) : null}
          </div>
        </div>
      </div>

      <label className="block space-y-1 text-xs text-muted-foreground">
        …or paste an https:// image URL
        <input
          className={field}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://…"
          value={value}
        />
      </label>

      {/* Sits outside the banner form: nesting one form inside another
          is invalid HTML, and the upload has to submit on its own
          without taking the half-filled banner with it. The file input
          and its button reach it by `form=`. */}
      <form action={action} id="promo-art-upload" />
    </div>
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
