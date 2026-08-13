"use client";

import { useEffect } from "react";

/**
 * The last resort: the root layout itself failed.
 *
 * `error.tsx` catches a page blowing up inside the layout. This catches
 * the layout blowing up, so React discards the whole tree — including
 * the `<html>` and `<body>` the layout owns, which is why this file has
 * to render its own.
 *
 * Everything here is inline style, deliberately. `globals.css` is
 * imported by the root layout; if the root layout is the thing that
 * failed, assuming its stylesheet arrived is exactly the assumption you
 * cannot make. Tailwind classes would leave an unstyled white page at
 * the one moment the brand most needs to look deliberate — so the four
 * colours are written out, taken from `globals.css`, and the page holds
 * up with no stylesheet, no fonts and no JavaScript beyond this
 * component.
 *
 * No header, no footer, no links into the site: those come from the
 * layout that just failed, and a nav bar that half-renders is worse
 * than none. Reload is the only honest action.
 */

/** Copied from `globals.css` — see above for why they are not tokens. */
const BACKGROUND = "#0b1120";
const FOREGROUND = "#f1f5f9";
const MUTED = "#94a3b8";
const ACCENT = "#2dd4bf";
const ACCENT_INK = "#042f2e";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[sydHustle] root layout failed:", error.digest ?? error.message);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: BACKGROUND,
          color: FOREGROUND,
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <main style={{ maxWidth: 460, textAlign: "center" }}>
          {/* The wordmark as text, not an image: a file that has to be
              fetched is one more thing that can be missing here. */}
          <p
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "-0.4px",
            }}
          >
            syd<span style={{ color: ACCENT }}>Hustle</span>
          </p>

          <h1
            style={{
              margin: "28px 0 0",
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: "-0.6px",
              lineHeight: 1.25,
            }}
          >
            sydHustle didn&apos;t load.
          </h1>

          <p
            style={{
              margin: "12px 0 0",
              fontSize: 15,
              lineHeight: 1.6,
              color: MUTED,
            }}
          >
            Something failed before the page could be built. This is our end,
            not yours, and it is usually temporary.
          </p>

          <button
            onClick={reset}
            style={{
              marginTop: 28,
              padding: "13px 28px",
              border: "none",
              borderRadius: 999,
              background: ACCENT,
              color: ACCENT_INK,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            type="button"
          >
            Reload
          </button>

          <p
            style={{
              margin: "28px 0 0",
              fontSize: 13,
              lineHeight: 1.6,
              color: MUTED,
            }}
          >
            {error.digest ? (
              <>
                Still stuck? Send us this reference:{" "}
                <code
                  style={{
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    color: FOREGROUND,
                  }}
                >
                  {error.digest}
                </code>{" "}
                &mdash;{" "}
              </>
            ) : (
              <>Still stuck? </>
            )}
            <a href="mailto:support@sydhustle.com" style={{ color: ACCENT }}>
              support@sydhustle.com
            </a>
          </p>
        </main>
      </body>
    </html>
  );
}
