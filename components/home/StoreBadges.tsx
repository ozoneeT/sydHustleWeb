import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/site";

/**
 * The two store badges.
 *
 * Drawn as inline SVG rather than pulled in as images: they sit in the
 * hero and are the page's primary call to action, so they must be sharp
 * at every size and must not wait on a network round trip. Apple and
 * Google both require the badge lock-up (logo + "Download on the" /
 * "GET IT ON" line) to stay intact, so the proportions here follow the
 * supplied artwork rather than being restyled to the site.
 *
 * Everything inside a badge is sized in `em` against a font size set to
 * the badge's own height, so one number scales the whole lock-up and the
 * hero pair can be genuinely large without redrawing anything.
 */

type Size = "sm" | "md" | "lg" | "fluid";

/** [height, font size driving the lock-up] */
const SIZES: Record<Size, string> = {
  sm: "h-11 text-[2.75rem]",
  md: "h-[3.25rem] text-[3.25rem]",
  lg: "h-[clamp(3.25rem,4.6vw,4.75rem)] text-[clamp(3.25rem,4.6vw,4.75rem)]",
  /* Height follows whatever font size the caller sets, so the hero can
     scale its badges off the device rather than off the window. */
  fluid: "h-[1em]",
};

/* The supplied artwork is 164 × 47 on a phone and 177 × 51 on desktop —
   3.49:1 either way. Pinning the width to that ratio keeps the two
   badges identical, which is what makes them line up when stacked. */
const SHELL =
  "group inline-flex w-[3.49em] shrink-0 items-center gap-[0.18em] rounded-[0.21em] border border-white/15 bg-black px-[0.24em] leading-none transition-transform duration-300 hover:scale-[1.04] active:scale-[0.98]";

function AppStoreBadge({ size }: { size: Size }) {
  return (
    <a
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener"
      aria-label="Download sydHustle on the App Store"
      className={`${SIZES[size]} ${SHELL}`}
    >
      <svg
        viewBox="0 0 384 512"
        aria-hidden="true"
        className="h-[0.5em] w-auto shrink-0 fill-white"
      >
        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
      </svg>
      <span className="flex min-w-0 flex-col items-start whitespace-nowrap text-white">
        <span className="text-[0.2em] font-normal tracking-wide">
          Download on the
        </span>
        <span className="mt-[0.04em] text-[0.4em] font-medium tracking-tight">
          App Store
        </span>
      </span>
    </a>
  );
}

function GooglePlayBadge({ size }: { size: Size }) {
  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener"
      aria-label="Get sydHustle on Google Play"
      className={`${SIZES[size]} ${SHELL}`}
    >
      <svg
        viewBox="0 0 512 512"
        aria-hidden="true"
        className="h-[0.52em] w-auto shrink-0"
      >
        <path
          fill="#00D7FE"
          d="M35.2 12.3C29.6 18.2 26.3 27.4 26.3 39.3v433.4c0 11.9 3.3 21.1 8.9 27l1.5 1.4 242.8-242.8v-5.7L35.2 12.3z"
        />
        <path
          fill="#FFCE00"
          d="M360.6 336.7l-80.9-81v-5.7l81-81 1.8 1 95.9 54.5c27.4 15.5 27.4 41 0 56.6l-95.9 54.5-1.9 1.1z"
        />
        <path
          fill="#FF3A44"
          d="M362.5 335.6l-82.8-82.8L35.2 497.4c9 9.5 24 10.7 40.8 1.2l286.5-163"
        />
        <path
          fill="#00F076"
          d="M362.5 170L76 7c-16.9-9.6-31.8-8.4-40.8 1.2l244.5 244.6L362.5 170z"
        />
      </svg>
      <span className="flex min-w-0 flex-col items-start whitespace-nowrap text-white">
        <span className="text-[0.2em] font-normal uppercase tracking-[0.14em]">
          Get it on
        </span>
        <span className="mt-[0.04em] text-[0.4em] font-medium tracking-tight">
          Google Play
        </span>
      </span>
    </a>
  );
}

export function StoreBadges({
  size = "md",
  className = "",
  style,
}: {
  size?: Size;
  className?: string;
  /** Used with size "fluid" to set the font size the lock-up scales off. */
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={`flex items-center ${className}`}
    >
      <AppStoreBadge size={size} />
      <GooglePlayBadge size={size} />
    </div>
  );
}
