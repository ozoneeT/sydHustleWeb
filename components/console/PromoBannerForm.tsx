"use client";

import { useActionState, useRef, useState } from "react";

import { ImagePlacer } from "@/components/console/ImagePlacer";
import { PromoPreview } from "@/components/console/PromoPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_ROUTE_PATHS, PROMO_SURFACES } from "@/lib/console/app-routes";
import {
  PROMO_ICONS,
  PROMO_PRESETS,
  type PromoPreset,
} from "@/lib/console/promo-presets";
import {
  deletePromoBanner,
  savePromoBanner,
  togglePromoBanner,
  type PromoActionState,
} from "@/lib/console/promo-actions";
import type { PromoBannerRow } from "@/lib/console/promos";

const INITIAL: PromoActionState = { error: null, done: false };

/**
 * One titled group of fields.
 *
 * The form had grown to roughly thirty controls in a single column,
 * where the only grouping was a couple of bare fieldsets — so finding
 * "the colour of the light-mode gradient" meant scanning the whole
 * thing. Titled sections give each decision a place to live.
 */
function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-white/10 bg-white/[0.015] p-4">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

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
  const [bgLightFrom, setBgLightFrom] = useState(
    banner?.bg_light_from ?? "#0F2E2E",
  );
  const [bgLightTo, setBgLightTo] = useState(banner?.bg_light_to ?? "#081A1A");
  const [bgDarkFrom, setBgDarkFrom] = useState(
    banner?.bg_dark_from ?? "#0F2E2E",
  );
  const [bgDarkTo, setBgDarkTo] = useState(banner?.bg_dark_to ?? "#081A1A");
  const [icon, setIcon] = useState(banner?.icon ?? "");
  const [imageZoom, setImageZoom] = useState(Number(banner?.image_zoom ?? 1));
  const [focusX, setFocusX] = useState(banner?.image_focus_x ?? 50);
  const [focusY, setFocusY] = useState(banner?.image_focus_y ?? 50);
  const [padLeft, setPadLeft] = useState(banner?.art_pad_left ?? 10);
  const [padRight, setPadRight] = useState(banner?.art_pad_right ?? 10);

  /**
   * Fill the form from a preset.
   *
   * Copies plain values in and stops — nothing records which preset was
   * used, so editing a preset here never rewrites a campaign that is
   * already running. Anything the preset doesn't mention keeps what is
   * on screen, so picking one late in an edit doesn't wipe the
   * placement you already set.
   */
  const applyPreset = (preset: PromoPreset) => {
    const v = preset.values;
    if (v.kind) setKind(v.kind);
    setEyebrow(v.eyebrow ?? "");
    setTitle(v.title ?? "");
    setSubtitle(v.subtitle ?? "");
    setCtaLabel(v.cta_label ?? "");
    setIcon(v.icon ?? "");
    if (v.image_mode) setImageMode(v.image_mode);
    if (v.image_side) setImageSide(v.image_side);
    if (v.image_scale !== undefined) setImageScale(Number(v.image_scale));
    if (v.height !== undefined) setHeight(v.height);
    if (v.width_pct !== undefined) setWidthPct(v.width_pct);
    if (v.background_mode) setBackgroundMode(v.background_mode);
    if (v.bg_dark_from) setBgDarkFrom(v.bg_dark_from);
    if (v.bg_dark_to) setBgDarkTo(v.bg_dark_to);
    if (v.bg_light_from) setBgLightFrom(v.bg_light_from);
    if (v.bg_light_to) setBgLightTo(v.bg_light_to);
  };

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
        <input name="bg_light_from" type="hidden" value={bgLightFrom} />
        <input name="bg_light_to" type="hidden" value={bgLightTo} />
        <input name="bg_dark_from" type="hidden" value={bgDarkFrom} />
        <input name="bg_dark_to" type="hidden" value={bgDarkTo} />
        <input name="icon" type="hidden" value={icon} />
        <input name="image_zoom" type="hidden" value={imageZoom} />
        <input name="image_focus_x" type="hidden" value={focusX} />
        <input name="image_focus_y" type="hidden" value={focusY} />

        <Section
          hint="Start from one, then change anything you like. Presets only fill the form; nothing stays linked to them afterwards."
          title="Preset"
        >
          <div className="flex flex-wrap gap-2">
            {PROMO_PRESETS.map((preset) => (
              <Button
                className="h-8 px-3 text-xs"
                key={preset.id}
                onClick={() => applyPreset(preset)}
                title={preset.description}
                type="button"
                variant="secondary"
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </Section>

        <Section
          hint="Custom is typed copy. Featured draws live hustleBoost placements instead."
          title="Type"
        >
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
        </Section>

        <Section
          hint={
            kind === "featured"
              ? "Only a heading — the cards themselves are the boosted listings."
              : undefined
          }
          title="Content"
        >
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
          {kind === "featured" ? null : (
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
          )}
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

        {kind === "featured" ? null : (
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
        )}
        </Section>

        {kind === "featured" ? (
          <Section
            hint="The cards themselves are fixed — same design as the main carousel. Only how much room they get is yours to set."
            title="Size"
          >
            <Slider
              defaultMark={184}
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
              defaultMark={100}
              label="Card width"
              max={100}
              min={60}
              name="width_pct"
              onChange={setWidthPct}
              unit="%"
              value={widthPct}
            />
            <p className="text-xs text-muted-foreground">
              Artwork, colours and layout aren&apos;t offered here on purpose:
              a Featured banner shows listings people <em>paid</em> to place,
              and restyling them would make the overflow surface a lesser
              version of what the main carousel gives. The default marker sits
              at the carousel&apos;s own height, so you can see when
              you&apos;re diverging from it.
            </p>
          </Section>
        ) : (
        <>
        <Section
          hint="An icon needs no upload and always looks finished. An image gives you a photo to place and zoom."
          title="Artwork"
        >
        <ArtPicker onChange={setImageUrl} value={imageUrl} />

        {imageUrl ? (
          <div className="space-y-3 rounded-lg border border-white/10 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Place the image
              </p>
              {imageMode !== "background" ? (
                <Button
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setImageMode("background")}
                  type="button"
                  variant="secondary"
                >
                  Switch to fills-the-card
                </Button>
              ) : null}
            </div>

            {/* Shown whatever the layout, because hiding it was the
                reason nobody could find it. Cropping only has meaning
                when the image fills the card — a side image is drawn
                `contain`, with nothing cropped away — so it says so
                rather than disappearing. */}
            {imageMode !== "background" ? (
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs text-amber-300">
                Zoom and position only apply when the artwork{" "}
                <strong>fills the card</strong>. In the{" "}
                {imageMode === "side" ? "beside-the-copy" : "no image"} layout
                the whole picture is shown, so there is nothing to crop.
              </p>
            ) : null}
            <ImagePlacer
              aspect={(390 - 32) / height}
              disabled={imageMode !== "background"}
              focusX={focusX}
              focusY={focusY}
              onFocus={(x, y) => {
                setFocusX(x);
                setFocusY(y);
              }}
              url={imageUrl}
              zoom={imageZoom}
            />
            <Slider
              defaultMark={100}
              label="Zoom"
              max={300}
              min={100}
              onChange={(next) => setImageZoom(next / 100)}
              unit="%"
              value={Math.round(imageZoom * 100)}
            />
            <p className="text-xs text-muted-foreground">
              The frame is the card&apos;s real shape, so what you see inside it
              is what a phone shows. Zooming crops further in around the point
              you dragged to.
            </p>
          </div>
        ) : null}

        </Section>

        <Section title="Layout">

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

          <div className="flex flex-wrap items-center gap-2">
            <span className="w-24 shrink-0 text-xs text-muted-foreground">
              Icon
            </span>
            <Button
              className="h-7 px-2.5 text-xs"
              onClick={() => setIcon("")}
              type="button"
              variant={icon === "" ? "default" : "secondary"}
            >
              None
            </Button>
            {PROMO_ICONS.map((option) => (
              <Button
                className="h-7 px-2.5 text-xs"
                key={option.value}
                onClick={() => setIcon(option.value)}
                type="button"
                variant={icon === option.value ? "default" : "secondary"}
              >
                {option.label}
              </Button>
            ))}
          </div>
          {icon && imageMode !== "side" ? (
            <p className="text-xs text-muted-foreground">
              An icon only draws in the <em>beside the copy</em> layout.
            </p>
          ) : null}

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
              {/* Separate per side because the art sits against one
                  edge: the gap to the card's edge and the gap to the
                  copy are different decisions. */}
              <Slider
                defaultMark={10}
                label="Pad left"
                max={48}
                min={0}
                name="art_pad_left"
                onChange={setPadLeft}
                unit="pt"
                value={padLeft}
              />
              <Slider
                defaultMark={10}
                label="Pad right"
                max={48}
                min={0}
                name="art_pad_right"
                onChange={setPadRight}
                unit="pt"
                value={padRight}
              />
            </>
          ) : null}

          {imageMode !== "background" ? (
            <>
              <Choice
                label="Background"
                onChange={(v) => setBackgroundMode(v as typeof backgroundMode)}
                options={[
                  { value: "gradient", label: "Gradient" },
                  { value: "solid", label: "Solid" },
                ]}
                value={backgroundMode}
              />

              <div className="space-y-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <ColourRow
                  from={bgDarkFrom}
                  isGradient={backgroundMode === "gradient"}
                  label="Dark mode"
                  onFrom={setBgDarkFrom}
                  onTo={setBgDarkTo}
                  to={bgDarkTo}
                />
                <ColourRow
                  from={bgLightFrom}
                  isGradient={backgroundMode === "gradient"}
                  label="Light mode"
                  onFrom={setBgLightFrom}
                  onTo={setBgLightTo}
                  to={bgLightTo}
                />
                <p className="text-xs text-muted-foreground">
                  Headline and subtitle colour is derived from the background,
                  so a pale choice gets dark text automatically — there is no
                  way to end up with white on white.
                </p>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              A background image covers the whole card, so its colours
              aren&apos;t used. Switch artwork to <em>beside the copy</em> or{" "}
              <em>no image</em> to set them.
            </p>
          )}

          <Slider
            defaultMark={150}
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
            defaultMark={100}
            label="Card width"
            max={100}
            min={60}
            name="width_pct"
            onChange={setWidthPct}
            unit="%"
            value={widthPct}
          />
        </Section>
        </>
        )}

        <Section title="Where it appears">
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
        </Section>

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
        {kind === "featured" ? (
          <div className="rounded-xl border border-white/10 p-4 text-sm text-muted-foreground">
            <p className="mb-2 font-medium text-foreground">
              Nothing to preview here.
            </p>
            <p>
              A Featured banner renders as a carousel of Featured cards, and
              which listings appear is decided at the moment it is shown —
              whichever boosted subscribers are furthest below their fair share
              of exposure and are not already in the main carousel. Drawing a
              mock-up would only show a set that will not be the set.
            </p>
          </div>
        ) : (
        <>
        <PromoPreview
          values={{
            eyebrow,
            title,
            subtitle,
            imageUrl,
            ctaLabel,
            // Always false here: this branch only renders for a custom
            // banner, and a custom banner is house content nobody paid
            // to place. The PROMOTED badge belongs to the featured kind,
            // which doesn't use this preview at all.
            isPaid: false,
            imageMode,
            imageSide,
            imageScale,
            height,
            widthPct,
            backgroundMode,
            bgLightFrom,
            bgLightTo,
            bgDarkFrom,
            bgDarkTo,
            icon,
            imageZoom,
            imageFocusX: focusX,
            imageFocusY: focusY,
            artPadLeft: padLeft,
            artPadRight: padRight,
          }}
        />
        <p className="text-xs text-muted-foreground">
          Drawn at a phone&apos;s real proportions.
        </p>
        </>
        )}
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
  defaultMark,
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
  /** Where the shipped default sits, drawn as a tick on the track.
   * Without it there is no way to tell whether you are extending past
   * the size everything else on the feed was designed around, or
   * pulling back from it. */
  defaultMark?: number;
  onChange: (value: number) => void;
}) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  const markPct =
    defaultMark === undefined
      ? null
      : ((defaultMark - min) / (max - min)) * 100;

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
      <div className="relative min-w-[9rem] flex-1">
        <input
          className="w-full cursor-pointer accent-accent"
          max={max}
          min={min}
          onChange={(event) => onChange(clamp(Number(event.target.value)))}
          step={step}
          type="range"
          value={value}
        />
        {markPct !== null ? (
          // Sits under the thumb's travel, inset by half a thumb at each
          // end so the tick lines up with the value rather than the raw
          // track — a range input's thumb never reaches the edges.
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[7px] top-0 bottom-0"
          >
            <span
              className="absolute top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-white/40"
              style={{ left: `${markPct}%` }}
              title={`Default: ${defaultMark}${unit}`}
            />
            <span
              className="absolute top-[calc(50%+9px)] -translate-x-1/2 whitespace-nowrap text-[10px] text-muted-foreground"
              style={{ left: `${markPct}%` }}
            >
              default
            </span>
          </div>
        ) : null}
      </div>

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
 * One scheme's background colours.
 *
 * A swatch and a hex box for each end, because both ways of choosing a
 * colour are the one people reach for: the picker when exploring, the
 * hex when matching something that already exists.
 */
function ColourRow({
  label,
  from,
  to,
  isGradient,
  onFrom,
  onTo,
}: {
  label: string;
  from: string;
  to: string;
  isGradient: boolean;
  onFrom: (value: string) => void;
  onTo: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="w-24 shrink-0 text-xs text-muted-foreground">
        {label}
      </span>
      <ColourField label="From" onChange={onFrom} value={from} />
      {isGradient ? <ColourField label="To" onChange={onTo} value={to} /> : null}
      <span
        className="h-7 w-16 shrink-0 rounded-md border border-white/10"
        style={{
          background: isGradient
            ? `linear-gradient(135deg, ${from}, ${to})`
            : from,
        }}
      />
    </div>
  );
}

function ColourField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      {label}
      <input
        className="h-7 w-8 cursor-pointer rounded border border-white/10 bg-transparent p-0.5"
        onChange={(event) => onChange(event.target.value.toUpperCase())}
        type="color"
        value={value}
      />
      <input
        className="w-[5.5rem] rounded-md border border-white/10 bg-transparent px-2 py-1 font-mono text-[11px] uppercase outline-none focus:border-accent/50"
        maxLength={7}
        onChange={(event) => onChange(event.target.value.toUpperCase())}
        value={value}
      />
    </label>
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
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Uploads with `fetch`, deliberately — not a server action.
   *
   * A server action submission makes Next re-render the route's server
   * components, which collapsed the `<details>` this form sits inside
   * and remounted it, throwing away every unsaved field. Picking a
   * picture should not cost someone the copy they just wrote. A plain
   * request returns a URL and nothing else on the page moves.
   */
  const upload = async () => {
    const file = input.current?.files?.[0];
    if (!file) {
      setError("Choose an image first.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/console/api/promo-art", {
        body,
        method: "POST",
      });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) {
        setError(result.error ?? "Upload failed.");
        return;
      }
      onChange(result.url);
      if (input.current) input.current.value = "";
    } catch {
      setError("Upload failed — check your connection.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt="Banner artwork"
            className="h-16 w-28 rounded-lg border border-white/10 object-contain"
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
            // Uploads as soon as a file is chosen. The two-step
            // "choose, then press Upload" was one step too many, and
            // leaving a chosen-but-unuploaded file on screen looked
            // exactly like an upload that had silently failed.
            onChange={() => void upload()}
            ref={input}
            type="file"
          />
          <div className="flex items-center gap-2">
            {busy ? (
              <span className="text-xs text-muted-foreground">Uploading…</span>
            ) : null}
            {value && !busy ? (
              <Button
                className="h-7 px-2 text-xs"
                onClick={() => onChange("")}
                type="button"
                variant="ghost"
              >
                Remove
              </Button>
            ) : null}
            {error ? (
              <span className="text-xs text-red-400">{error}</span>
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
