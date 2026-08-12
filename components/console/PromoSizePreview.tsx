"use client";

/**
 * The size of a Featured card, at a phone's real proportions.
 *
 * Deliberately empty. Which listings appear is decided at the moment
 * the banner is shown — whichever boosted subscribers are furthest
 * below their fair share and are not already in the main carousel — so
 * drawing sample content would show a set that will not be the set.
 * What IS knowable in advance is how much room the cards get, and that
 * is the thing the sliders change, so that is what this shows.
 *
 * The chrome is the real card's: 22pt radius, a 2pt brand ring, the
 * FEATURED pill. Enough to recognise what is being sized without
 * pretending to preview its contents.
 */

const PHONE_WIDTH = 390;
/** `INSET` in the mobile carousel — wider than the feed's own gutter,
 * because a full-width promo card is inset further than a listing. */
const CAROUSEL_INSET = 20;

const SCHEMES = {
  dark: {
    page: "#081D1C",
    surface: "#12332F",
    ring: "#14B8A6",
    pillText: "#081A1A",
    label: "rgba(248,250,252,0.55)",
  },
  light: {
    page: "#F8FAFC",
    surface: "#FFFFFF",
    ring: "#0F2E2E",
    pillText: "#FFFFFF",
    label: "rgba(15,23,42,0.55)",
  },
} as const;

export function PromoSizePreview({
  height,
  widthPct,
}: {
  height: number;
  widthPct: number;
}) {
  const cardWidth = Math.round(
    ((PHONE_WIDTH - CAROUSEL_INSET * 2) * widthPct) / 100,
  );

  return (
    <div className="space-y-3">
      {(["dark", "light"] as const).map((scheme) => {
        const s = SCHEMES[scheme];
        return (
          <div
            className="rounded-2xl p-4"
            key={scheme}
            style={{ background: s.page }}
          >
            <div style={{ width: PHONE_WIDTH, margin: "0 auto" }}>
              <div
                className="relative"
                style={{
                  width: cardWidth,
                  height,
                  margin: "0 auto",
                  borderRadius: 22,
                  border: `2px solid ${s.ring}`,
                  background: s.surface,
                }}
              >
                <span
                  className="absolute rounded-full px-2.5 py-1.5"
                  style={{
                    top: 12,
                    left: 12,
                    background: s.ring,
                    color: s.pillText,
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: 0.6,
                  }}
                >
                  ✦ FEATURED
                </span>

                <span
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ color: s.label, fontSize: 12 }}
                >
                  {cardWidth} × {height} pt
                </span>
              </div>

              <p
                className="mt-3 text-center text-xs"
                style={{ color: s.label }}
              >
                {scheme === "dark" ? "Dark mode" : "Light mode"} · one card of
                the carousel on a 390pt screen
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
