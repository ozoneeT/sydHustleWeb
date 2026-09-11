"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useTransform } from "framer-motion";
import { MapPin, ShieldCheck, Star } from "lucide-react";
import { AppSimulator } from "@/components/home/AppSimulator";
import { PhoneOverlays } from "@/components/home/PhoneOverlays";
import { PhoneFrame, PhoneGlow } from "@/components/home/PhoneFrame";
import { PINNED, useSectionProgress } from "@/components/home/useSectionProgress";
import { StoreBadges } from "@/components/home/StoreBadges";

/**
 * The hero.
 *
 * A tall section with a sticky stage inside it, so the opening is driven
 * by scroll position rather than by time.
 *
 * The device starts big enough that its screen is most of the window —
 * the opening copy reads as if printed on it — but deliberately NOT big
 * enough to lose the top bezel: the rounded corners, the island and the
 * halo behind them are what make it read as a phone rather than a black
 * rectangle. It is pushed down the window so that top edge lands just
 * under the header, then shrinks into the hand as you scroll, stopping
 * on three beats of the product.
 *
 * Progress is measured off the page's own scroll position rather than a
 * section-relative one: this stage owns the top of the document, so
 * `scrollY / stageHeight` is exact, and it keeps every value below on a
 * single source that cannot drift between them.
 */

/*
 * The beats. The reference pairs a grey word on one side of the device
 * with an accented one on the other — "Chat." against "Pay." — so the
 * opening beat here reads "Post." / "Hustle" across the phone.
 */
const BEATS = ["Post.", "Hustle", "Chat.", "Paid."] as const;

/*
 * Positions match the reference's coins: outside the device, never over
 * the copy. On a phone the copy owns the top half of the window and the
 * device rises into the bottom, so they sit low, around its shoulders.
 */
const ORBS = [
  {
    icon: MapPin,
    at: "left-[6vw] top-[62vh] md:left-[16vw] md:top-[52vh]",
    drift: "levitate-a",
  },
  {
    icon: ShieldCheck,
    at: "left-[16vw] top-[55vh] md:left-[22vw] md:top-[17vh]",
    drift: "levitate-b",
  },
  {
    icon: Star,
    at: "right-[8vw] top-[58vh] md:right-[17vw] md:top-[38vh]",
    drift: "levitate-b",
  },
] as const;

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const p = useSectionProgress(ref, PINNED);

  /* How far this section scrolls before the sticky stage releases, and
     where the device sits at each end of that travel.
     
     The device is anchored to the top of the stage and scaled from its
     top edge, so the bezel, the island and the halo behind them hold
     their place on any window — centring it instead pushes the top edge
     off-screen the moment the window is tall and narrow. */
  const phoneRef = useRef<HTMLDivElement>(null);
  const [geom, setGeom] = useState({ zoom: 3.7, top: 0, rest: 0, mobile: 0 });
  useEffect(() => {
    const measure = () => {
      const phone = phoneRef.current;
      if (!phone) return;

      /*
       * Measured off the reference, which expresses all of this in its
       * root unit — 1vw, stepping to 0.8vw above 1920px:
       *   top edge opens 10u down and settles 5u down
       *   opening width is 69.3vw, stepping to 55.2vw above 1920px
       * The device rests wider than the reference's does — 22.5vw
       * rather than 18.7 — so the zoom factor is what carries the
       * difference. Opening width is unchanged either way.
       */
      const vh = window.innerHeight;
      const mobile = window.matchMedia("(max-width: 767px)").matches;

      if (mobile) {
        /*
         * The reference's phone layout, measured at 375×812: the device
         * enters from 66vh — below the copy, its top bezel just in shot
         * — and rises to 6vh, at a constant size. No zoom at all.
         */
        // 9vh rather than the reference's 6vh: its header hides on
        // scroll and ours does not, so the device has to come to rest
        // clear of the 56px bar instead of under it.
        setGeom({ zoom: 1, top: vh * 0.66, rest: vh * 0.09, mobile: 1 });
        return;
      }

      const wide = window.matchMedia("(min-width: 1920px)").matches;
      const u = phone.offsetWidth * (wide ? 0.0356 : 0.0444);
      setGeom({
        zoom: wide ? 2.453 : 3.08,
        top: u * 10,
        rest: u * 5,
        mobile: 0,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  /* The zoom out. */
  const phoneScale = useTransform(p, [0, 0.28], [geom.zoom, 1]);
  const phoneY = useTransform(p, [0, 0.28], [geom.top, geom.rest]);

  /* The opening copy is painted on the screen while the screen is most
     of the window, and leaves as soon as the device starts shrinking. */
  const introOpacity = useTransform(p, [0.02, 0.12], [1, 0]);
  const introY = useTransform(p, [0.02, 0.12], [0, -70]);

  /* The screen stays dark under the copy, then the app is switched on. */
  /* Only desktop prints the opening copy on the screen, so only
     desktop needs the screen covered while it does. */
  const scrimOpacity = useTransform(p, [0.08, 0.26], [1 - geom.mobile, 0]);

  /* The three beats. */
  const word0 = useTransform(p, [0.31, 0.37, 0.58, 0.62], [0, 1, 1, 0]);
  const word0X = useTransform(p, [0.31, 0.37], [-40, 0]);
  const word0Right = useTransform(p, [0.31, 0.37], [40, 0]);
  const word1 = useTransform(p, [0.75, 0.8, 0.92, 0.95], [0, 1, 1, 0]);
  const word1X = useTransform(p, [0.75, 0.8], [40, 0]);
  const word2 = useTransform(p, [0.95, 0.99], [0, 1]);
  const word2X = useTransform(p, [0.95, 0.99], [40, 0]);

  /* The halo sits behind the device's shoulders and is brightest while
     the device is largest, exactly as the reference lights its hero. */
  const haloOpacity = useTransform(p, [0, 0.3], [1, 0.42]);
  const haloScale = useTransform(p, [0, 0.3], [1, 0.72]);
  const orbOpacity = useTransform(p, [0, 0.28, 0.36], [1, 1, 0]);
  const hintOpacity = useTransform(p, [0, 0.06], [1, 0]);

  /* While the device is bigger than the window it has no bottom edge in
     shot, and the reference lets it dissolve into the page rather than
     running a lit bezel to the fold. This is that falloff; it lifts as
     the device shrinks and gets a real bottom edge of its own. */
  /* The reference fades its second bloom in over the same stretch the
     device takes to settle. */
  const settle = useTransform(p, [0.08, 0.3], [0, 1]);

  return (
    <section ref={ref} className="relative h-[700vh]">
      {/* `--phone-w` is declared on `.marketing` in globals.css, where
          the reference's 1920px step can apply to it. Measured off the
          reference: the device opens 3.68× its resting width with its
          top edge at 13.2vh, settling to 7.5vh. */}
      <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden">
        {/* The halo. Sized and placed against the device's top edge. */}
        <motion.div
          aria-hidden
          style={{ opacity: haloOpacity, scale: haloScale }}
          className="pointer-events-none absolute left-1/2 top-[-30vh] h-[54vh] w-[86vw] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(94,234,212,0.13),rgba(20,184,166,0.05)_40%,transparent_72%)]"
        />

        {/* The floating tokens, outside the device on both sides. */}
        <motion.div
          aria-hidden
          style={{ opacity: orbOpacity }}
          className="pointer-events-none absolute inset-0"
        >
          {ORBS.map((orb, i) => (
            <span
              key={i}
              className={`absolute ${orb.at} ${orb.drift} grid h-[clamp(2.5rem,4.4vw,4rem)] w-[clamp(2.5rem,4.4vw,4rem)] place-items-center rounded-full`}
              style={{
                /* The body: dark metal, lightest where the horizon
                   behind the device would catch its top edge. */
                background:
                  "radial-gradient(circle at 38% 24%, #2a4b47 0%, #16302d 38%, #0a1a19 72%, #050d0d 100%)",
                boxShadow: [
                  /* the edge the light catches */
                  "inset 0 0.06em 0.02em rgba(153,246,228,0.55)",
                  /* the unlit underside */
                  "inset 0 -0.12em 0.3em rgba(0,0,0,0.75)",
                  /* a thin machined rim */
                  "0 0 0 0.045em rgba(94,234,212,0.34)",
                  /* what it actually throws, not a bulb */
                  "0 0.1em 0.9em -0.25em rgba(20,184,166,0.45)",
                ].join(","),
              }}
            >
              <orb.icon
                className="h-[42%] w-[42%]"
                style={{ color: "#5eead4" }}
                strokeWidth={1.75}
              />
              {/* The specular, placed where the key light is. */}
              <span
                aria-hidden
                className="pointer-events-none absolute left-[16%] top-[10%] h-[26%] w-[38%] -rotate-[18deg] rounded-[50%]"
                style={{
                  background:
                    "linear-gradient(160deg,rgba(255,255,255,0.55),rgba(255,255,255,0) 70%)",
                }}
              />
            </span>
          ))}
        </motion.div>

        {/* The three beats. */}
        <motion.p
          style={{ opacity: word0, x: word0X }}
          className="t-display t-ghost pointer-events-none absolute bottom-[7vh] left-1/2 -translate-x-1/2 md:bottom-auto md:left-auto md:top-1/2 md:-translate-x-0 md:-translate-y-1/2 md:right-[calc(50%+var(--phone-w)*0.62)]"
        >
          {BEATS[0]}
        </motion.p>
        <motion.p
          style={{ opacity: word0, x: word0Right }}
          className="t-display t-accent pointer-events-none absolute hidden bottom-[7vh] left-1/2 -translate-x-1/2 md:block md:bottom-auto md:right-auto md:top-1/2 md:-translate-x-0 md:-translate-y-1/2 md:left-[calc(50%+var(--phone-w)*0.62)]"
        >
          {BEATS[1]}
        </motion.p>
        <motion.p
          style={{ opacity: word1, x: word1X }}
          className="t-display t-ghost pointer-events-none absolute bottom-[7vh] left-1/2 -translate-x-1/2 md:bottom-auto md:right-auto md:top-1/2 md:-translate-x-0 md:-translate-y-1/2 md:left-[calc(50%+var(--phone-w)*0.42)]"
        >
          {BEATS[2]}
        </motion.p>
        <motion.p
          style={{ opacity: word2, x: word2X }}
          className="t-display t-ghost pointer-events-none absolute bottom-[7vh] left-1/2 -translate-x-1/2 md:bottom-auto md:right-auto md:top-1/2 md:-translate-x-0 md:-translate-y-1/2 md:left-[calc(50%+var(--phone-w)*0.42)]"
        >
          {BEATS[3]}
        </motion.p>

        {/* The device, painted over the beats. */}
        <motion.div
          ref={phoneRef}
          style={{
            scale: phoneScale,
            y: phoneY,
            transformOrigin: "top center",
          }}
          className="absolute top-0 w-[var(--phone-w)] will-change-transform"
        >
          <PhoneGlow settle={settle} />
          <PhoneFrame overlay={<PhoneOverlays p={p} />}>
            <AppSimulator p={p} />
            <motion.div
              aria-hidden
              style={{ opacity: scrimOpacity }}
              className="absolute inset-0 bg-[#05100f]"
            >
              {/* Sunrise at the top of the screen, over an opaque base so
                  the screenshot cannot read through the clear stops. */}
              <div className="absolute inset-0 bg-[radial-gradient(120%_46%_at_50%_-12%,rgba(94,234,212,0.20),rgba(20,184,166,0.08)_34%,rgba(5,16,15,0)_66%)]" />
            </motion.div>
          </PhoneFrame>
        </motion.div>

        {/* The reference's `hero-down-mask`: a constant strip along the
            bottom of the stage that the device dissolves into, 20u tall
            and solid by 75% of its own height. It sits above everything,
            including the copy, exactly as its z-index 1600 does. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[calc(var(--ru)*20)] bg-[linear-gradient(to_bottom,rgba(5,5,6,0)_0%,#050506_75%)]"
        />

        {/*
          The opening copy, printed on the screen.

          Laid out as the reference lays its own out and measured against
          it at 1274×750: one standfirst line above a two-line headline,
          then the badges — no eyebrow, nothing under the headline.

          Every figure is in the reference's own unit, straight off its
          measurements there (1u = 12.74px at that width):

            standfirst  top 23.2u   type 1.386u
            headline    top 26u     type 4.72u
            badges      top 40.4u   height 4u   gap 1.26u
        */}
        <motion.div
          style={{ opacity: introOpacity, y: introY }}
          className="absolute inset-x-0 top-[13vh] mx-auto flex max-w-[86vw] flex-col items-center px-5 text-center md:top-[calc(var(--u)*23.2)] md:max-w-[calc(var(--u)*58)]"
        >
          <p className="text-[4.2vw] leading-[1.35] text-[color:var(--muted-foreground)] md:text-[calc(var(--u)*1.386)] md:leading-[1.2]">
            Escrow-protected payments, from people nearby.
          </p>
          <h1 className="t-silver mt-[3.2vw] text-balance text-[9.6vw] font-medium leading-[1.13] tracking-[-0.028em] md:mt-[calc(var(--u)*1.14)] md:text-[calc(var(--u)*4.72)]">
            Get it done by someone nearby.
          </h1>
          <StoreBadges
            size="fluid"
            className="mt-[8vw] flex-col gap-[2.8vw] text-[12.5vw] md:mt-[calc(var(--u)*2.8)] md:flex-row md:gap-[calc(var(--u)*1.26)] md:text-[calc(var(--u)*4)]"
          />
        </motion.div>

        <motion.div
          aria-hidden
          style={{ opacity: hintOpacity }}
          className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 md:block"
        >
          <div className="flex h-9 w-[1.4rem] items-start justify-center rounded-full border border-white/25 p-1.5">
            <span className="h-1.5 w-1 animate-bounce rounded-full bg-white/70" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
