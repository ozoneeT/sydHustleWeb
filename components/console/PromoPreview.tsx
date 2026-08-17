"use client";

import {
  Gift,
  Megaphone,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Star,
  TrendingUp,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Ionicons name → the nearest Lucide equivalent.
 *
 * The app draws from Ionicons and the console from Lucide, so the
 * preview can only be honest about an icon it has a stand-in for. The
 * curated list in `promo-presets.ts` is what keeps the two in step; a
 * name missing here renders nothing rather than guessing.
 */
const ICONS: Record<string, LucideIcon> = {
  "chatbubble-ellipses": MessageCircle,
  rocket: Rocket,
  "shield-checkmark": ShieldCheck,
  "trending-up": TrendingUp,
  wallet: Wallet,
  flash: Zap,
  star: Star,
  gift: Gift,
  megaphone: Megaphone,
};

/**
 * What the banner will look like on a phone.
 *
 * A deliberate re-implementation of `PromoBanner` in the mobile repo,
 * not an iframe or a screenshot — the console has no React Native to
 * run. That means the two can drift, so this file mirrors the mobile
 * component's structure element for element and takes every dimension
 * from the same fields rather than eyeballing it. When one changes, the
 * other has to.
 *
 * Rendered inside a fixed 390pt-wide frame (an iPhone 14's logical
 * width) so proportions match what a Hustler actually sees, rather than
 * whatever width the console window happens to be.
 */

/** Brand constants, copied from the app's `Colors`. */
const BRAND = {
  primary: "#14B8A6",
  secondaryDark: "#081A1A",
  white: "#FFFFFF",
  scrimSoft: "rgba(8,26,26,0.6)",
  scrim: "rgba(8,26,26,0.94)",
};

/** The feed behind the card, per scheme — from the app's palette. */
const FEED = {
  dark: { background: "#081D1C", outline: "rgba(20,184,166,0.30)" },
  light: { background: "#F8FAFC", outline: "#E2E8F0" },
};

/**
 * Black or white, whichever stays readable on `hex`.
 *
 * Mirrors `contrastText` in `src/shared/lib/color.ts` in the mobile
 * repo — same WCAG luminance formula, same threshold. If one changes,
 * the other has to, or the preview starts lying about legibility.
 */
export function contrastText(hex: string): string {
  const value = hex.replace("#", "");
  if (value.length !== 6) return BRAND.white;

  const channel = (start: number) => {
    const srgb = parseInt(value.slice(start, start + 2), 16) / 255;
    return srgb <= 0.03928
      ? srgb / 12.92
      : Math.pow((srgb + 0.055) / 1.055, 2.4);
  };

  const luminance =
    0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  return luminance > 0.4 ? "#0F172A" : BRAND.white;
}

/** The app's feed gutter — `FEED_INSET` in the mobile repo. */
const FEED_INSET = 16;
const PHONE_WIDTH = 390;

export type PreviewValues = {
  eyebrow: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaLabel: string;
  isPaid: boolean;
  imageMode: "background" | "side" | "none";
  imageSide: "left" | "right";
  imageScale: number;
  height: number;
  widthPct: number;
  backgroundMode: "solid" | "gradient";
  bgLightFrom: string;
  bgLightTo: string;
  bgDarkFrom: string;
  bgDarkTo: string;
  icon: string;
  imageZoom: number;
  imageFocusX: number;
  imageFocusY: number;
  artPadLeft: number;
  artPadRight: number;
  eyebrowSize: number;
  titleSize: number;
  subtitleSize: number;
  /** Empty string = derive it from the background, the default. */
  eyebrowColor: string;
  titleColor: string;
  subtitleColor: string;
};

/**
 * How big the stand-in icon is drawn.
 *
 * Mirrors `iconGlyphSize` in `promo-banner.tsx` in the mobile repo.
 * Width leads because width is what the slider drags; height is a
 * ceiling so a wide box can't produce a glyph taller than its card.
 */
function iconGlyphSize(boxWidth: number, cardHeight: number): number {
  return Math.max(14, Math.min(boxWidth * 0.8, cardHeight * 0.62, 200));
}

/** Both schemes, side by side — the only honest way to check a colour
 * pair, since one set has to work on two very different feeds. */
export function PromoPreview({ values }: { values: PreviewValues }) {
  return (
    <div className="space-y-3">
      <PromoPreviewPane scheme="dark" values={values} />
      <PromoPreviewPane scheme="light" values={values} />
    </div>
  );
}

function PromoPreviewPane({
  values,
  scheme,
}: {
  values: PreviewValues;
  scheme: "light" | "dark";
}) {
  const hasImage = Boolean(values.imageUrl) && values.imageMode !== "none";
  const isBackground = hasImage && values.imageMode === "background";
  const Icon = values.icon ? ICONS[values.icon] : undefined;
  // An icon stands in for a side image when there is no artwork, which
  // is what lets a preset look finished the moment it is picked.
  const isSide = values.imageMode === "side" && (hasImage || Boolean(Icon));

  const available = PHONE_WIDTH - FEED_INSET * 2;
  const cardWidth = Math.round((available * values.widthPct) / 100);

  const from = scheme === "dark" ? values.bgDarkFrom : values.bgLightFrom;
  const to = scheme === "dark" ? values.bgDarkTo : values.bgLightTo;
  const feed = FEED[scheme];

  const background = isBackground
    ? `linear-gradient(135deg, ${BRAND.scrimSoft}, ${BRAND.scrim})`
    : values.backgroundMode === "solid"
      ? from
      : `linear-gradient(135deg, ${from}, ${to})`;

  // A photo background always carries the dark scrim, so text stays
  // white there whatever the colour fields say.
  const ink = isBackground
    ? BRAND.white
    : contrastText(values.backgroundMode === "solid" ? from : to);

  return (
    <div
      className="flex justify-center rounded-2xl p-4"
      style={{ background: feed.background }}
    >
      <div style={{ width: PHONE_WIDTH }}>
        <div
          className="relative overflow-hidden"
          style={{
            width: cardWidth,
            height: values.height,
            margin: "0 auto",
            borderRadius: 20,
            border: `1px solid ${feed.outline}`,
            backgroundColor: from,
          }}
        >
          {/* An <img> rather than a background, so zoom and focal point
              use the same `object-fit`/`object-position` the app's
              `contentFit`/`contentPosition` map onto. */}
          {isBackground ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              src={values.imageUrl}
              style={{
                objectPosition: `${values.imageFocusX}% ${values.imageFocusY}%`,
                transform:
                  values.imageZoom !== 1
                    ? `scale(${values.imageZoom})`
                    : undefined,
              }}
            />
          ) : null}
          <div className="absolute inset-0" style={{ background }} />

          <div
            className="relative flex h-full items-center"
            style={{
              flexDirection:
                isSide && values.imageSide === "left" ? "row-reverse" : "row",
            }}
          >
            <div
              className="flex min-w-0 flex-1 flex-col gap-[3px]"
              style={{ padding: 18 }}
            >
              {values.isPaid ? (
                <span
                  className="self-start rounded-full px-2 py-1"
                  style={{
                    background: BRAND.primary,
                    color: BRAND.secondaryDark,
                    fontSize: 9,
                    fontWeight: 900,
                    letterSpacing: 0.6,
                  }}
                >
                  ✦ PROMOTED
                </span>
              ) : values.eyebrow ? (
                <p
                  className="truncate"
                  style={{
                    color: values.eyebrowColor || BRAND.primary,
                    fontSize: values.eyebrowSize,
                    fontWeight: 900,
                    letterSpacing: 1,
                  }}
                >
                  {values.eyebrow}
                </p>
              ) : null}

              {values.title ? (
                <p
                  style={{
                    color: values.titleColor || ink,
                    fontSize: values.titleSize,
                    fontWeight: 800,
                    // Leading follows the size, as it does in the app.
                    lineHeight: `${Math.round(values.titleSize * 1.26)}px`,
                    letterSpacing: "-0.4px",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {values.title}
                </p>
              ) : null}

              {values.subtitle ? (
                <p
                  style={{
                    color: values.subtitleColor || ink,
                    opacity: values.subtitleColor ? 1 : 0.75,
                    fontSize: values.subtitleSize,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {values.subtitle}
                </p>
              ) : null}

              {values.ctaLabel ? (
                <span
                  className="mt-2.5 inline-flex self-start items-center gap-1.5 rounded-full"
                  style={{
                    background: BRAND.primary,
                    color: BRAND.secondaryDark,
                    fontSize: 13,
                    fontWeight: 800,
                    padding: "9px 14px",
                  }}
                >
                  {values.ctaLabel} →
                </span>
              ) : null}
            </div>

            {isSide && !hasImage && Icon ? (
              <div
                className="flex items-center justify-center"
                style={{
                  width: `${values.imageScale * 100}%`,
                  marginLeft: values.artPadLeft,
                  marginRight: values.artPadRight,
                  color: values.titleColor || ink,
                  opacity: 0.9,
                }}
              >
                <Icon
                  size={iconGlyphSize(
                    (cardWidth * values.imageScale) -
                      values.artPadLeft -
                      values.artPadRight,
                    values.height,
                  )}
                />
              </div>
            ) : isSide ? (
              // `contain`, matching the app: a side image is usually an
              // icon or a cut-out, and cropping one to fill a box loses
              // the thing it was a picture of.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                className="object-contain"
                src={values.imageUrl}
                style={{
                  width: `${values.imageScale * 100}%`,
                  height: "82%",
                  marginLeft: values.artPadLeft,
                  marginRight: values.artPadRight,
                }}
              />
            ) : null}
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          {scheme === "dark" ? "Dark mode" : "Light mode"} · {cardWidth} ×{" "}
          {values.height} pt on a 390pt screen
        </p>
      </div>
    </div>
  );
}
