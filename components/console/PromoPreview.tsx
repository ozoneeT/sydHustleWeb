"use client";

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
  secondary: "#0F2E2E",
  secondaryDark: "#081A1A",
  white: "#FFFFFF",
  scrimSoft: "rgba(8,26,26,0.6)",
  scrim: "rgba(8,26,26,0.94)",
  cardOutline: "rgba(20,184,166,0.30)",
  feedBackground: "#081D1C",
};

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
};

export function PromoPreview({ values }: { values: PreviewValues }) {
  const hasImage = Boolean(values.imageUrl) && values.imageMode !== "none";
  const isBackground = hasImage && values.imageMode === "background";
  const isSide = hasImage && values.imageMode === "side";

  const available = PHONE_WIDTH - FEED_INSET * 2;
  const cardWidth = Math.round((available * values.widthPct) / 100);

  const background = isBackground
    ? `linear-gradient(135deg, ${BRAND.scrimSoft}, ${BRAND.scrim})`
    : values.backgroundMode === "solid"
      ? BRAND.secondary
      : `linear-gradient(135deg, ${BRAND.secondary}, ${BRAND.secondaryDark})`;

  return (
    <div
      className="flex justify-center rounded-2xl p-4"
      style={{ background: BRAND.feedBackground }}
    >
      <div style={{ width: PHONE_WIDTH }}>
        <div
          className="relative overflow-hidden"
          style={{
            width: cardWidth,
            height: values.height,
            margin: "0 auto",
            borderRadius: 20,
            border: `1px solid ${BRAND.cardOutline}`,
            backgroundColor: BRAND.secondary,
            backgroundImage: isBackground
              ? `url(${values.imageUrl})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
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
                    color: BRAND.primary,
                    fontSize: 10,
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
                    color: BRAND.white,
                    fontSize: 19,
                    fontWeight: 800,
                    lineHeight: "24px",
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
                    color: "rgba(255,255,255,0.75)",
                    fontSize: 13,
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

            {isSide ? (
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
                  margin: "0 10px",
                }}
              />
            ) : null}
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          {cardWidth} × {values.height} pt on a 390pt screen
          {values.widthPct < 100 ? ` · ${values.widthPct}% width` : ""}
        </p>
      </div>
    </div>
  );
}
