"use client";

import { MotionValue, motion, useTransform } from "framer-motion";
import {
  BadgeCheck,
  ChevronRight,
  Check,
  Clock,
  CreditCard,
  MapPin,
  Send,
  Users,
} from "lucide-react";

/**
 * The three cards that overhang the device.
 *
 * They live in the device's own coordinate space — absolutely positioned
 * children of the frame, outside the clipped screen — so they can be
 * placed against the interface behind them and still break past the
 * bezel. That is how the composer can start docked in the gap under the
 * search banner, exactly where the app puts it, and then grow out of the
 * phone as you scroll without ever jumping position.
 *
 * Everything is in `cqw` against the frame, so all three scale with the
 * device instead of drifting out of proportion with it.
 */

/* The app's dark palette, shared with the interface behind these. */
const TEAL = "#14b8a6";
const CARD = "#0a2a26";
const FIELD = "#0d332e";
const CHIP = "#12403a";
const TEXT = "#e6f4f1";
const MUTED = "#7fa39c";
const DIVIDER = "rgba(255,255,255,0.07)";

export function PhoneOverlays({ p }: { p: MotionValue<number> }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <Composer p={p} />
      <Posted p={p} />
      <Payout p={p} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1 — The composer: docked, then grown, then filled in                */
/* ------------------------------------------------------------------ */

function Composer({ p }: { p: MotionValue<number> }) {
  /* In before the scrim lifts, so the screen is never revealed with an
     empty grey slot under the banner. */
  const opacity = useTransform(p, [0.1, 0.18, 0.62, 0.66], [0, 1, 1, 0]);

  /* Docked, the card is 90cqw wide inside a 100cqw screen — the 5cqw
     margin down each side that the app itself leaves — and its top edge
     sits just under the header. Grown, it is 114cqw: enough to break
     both bezels, but narrow enough that the beat words either side of
     the device are not buried under it.
     
     0.79 × 114cqw = 90cqw. The growth starts at 0.3, straight after the
     device's zoom finishes at 0.28: the settled phone is the last
     position it reaches, and the composer comes out of it from there. */
  const scale = useTransform(p, [0.3, 0.42], [0.79, 1]);
  const y = useTransform(p, [0.3, 0.42], ["30%", "0%"]);

  const typed = useTransform(p, [0.46, 0.53], ["0%", "100%"]);
  const caret = useTransform(p, [0.46, 0.53], [1, 0]);
  const whereIn = useTransform(p, [0.525, 0.55], [0, 1]);
  const whenIn = useTransform(p, [0.55, 0.575], [0, 1]);
  const offerIn = useTransform(p, [0.575, 0.6], [0, 1]);
  const live = useTransform(p, [0.6, 0.625], [0, 1]);
  const btnBg = useTransform(live, [0, 1], ["#123a34", TEAL]);
  const btnFg = useTransform(live, [0, 1], ["#6f938c", "#04211d"]);

  return (
    <motion.div
      style={{
        opacity,
        scale,
        y,
        transformOrigin: "top center",
        backgroundColor: CARD,
      }}
      className="absolute left-[-7cqw] top-[46cqw] w-[114cqw] rounded-[6cqw] p-[6cqw] text-left shadow-[0_2cqw_5cqw_-1cqw_rgba(0,0,0,0.85)] ring-1 ring-white/12"
    >
      <p
        className="text-[2.8cqw] font-bold tracking-[0.18em]"
        style={{ color: MUTED }}
      >
        I NEED SOMEONE TO…
      </p>

      {/* Two lines tall at rest, as the app's field is. */}
      <div
        className="mt-[4.4cqw] flex min-h-[14cqw] items-start rounded-[3.6cqw] px-[4.4cqw] py-[3.8cqw] text-[3.5cqw] font-medium leading-snug"
        style={{ backgroundColor: FIELD, color: TEXT }}
      >
        <motion.span
          style={{ width: typed }}
          className="inline-block overflow-hidden whitespace-nowrap"
        >
          help me move a box
        </motion.span>
        <motion.span
          style={{ opacity: caret }}
          className="ml-[0.4cqw] inline-block h-[4cqw] w-[0.45cqw] shrink-0 bg-current"
        />
      </div>

      <div
        className="mt-[4cqw] rounded-[3.6cqw]"
        style={{ backgroundColor: FIELD }}
      >
        <Row icon={MapPin} placeholder="Where do you need help?" value="Iwo Road, Ibadan" progress={whereIn} />
        <Row icon={Clock} placeholder="When do you need this done?" value="ASAP" progress={whenIn} divided />
        <Row icon={CreditCard} placeholder="Set your offer (min 500)" value="₦3,000" progress={offerIn} divided />
      </div>

      <motion.div
        style={{ backgroundColor: btnBg, color: btnFg }}
        className="mt-[5.4cqw] flex items-center justify-center gap-[1.8cqw] rounded-[3.6cqw] py-[4.2cqw] text-[3.9cqw] font-bold"
      >
        <Send className="h-[3.6cqw] w-[3.6cqw]" />
        Post this Hustle
      </motion.div>
    </motion.div>
  );
}

function Row({
  icon: Icon,
  placeholder,
  value,
  progress,
  divided = false,
}: {
  icon: typeof MapPin;
  placeholder: string;
  value: string;
  progress: MotionValue<number>;
  divided?: boolean;
}) {
  const placeholderOpacity = useTransform(progress, [0, 0.5], [1, 0]);
  const valueOpacity = useTransform(progress, [0.5, 1], [0, 1]);
  const valueX = useTransform(progress, [0.5, 1], [8, 0]);

  return (
    <div
      className="flex items-center gap-[3cqw] px-[4cqw] py-[3.8cqw]"
      style={divided ? { borderTop: `1px solid ${DIVIDER}` } : undefined}
    >
      <span
        className="flex h-[7.4cqw] w-[7.4cqw] shrink-0 items-center justify-center rounded-[2.4cqw]"
        style={{ backgroundColor: CHIP }}
      >
        <Icon className="h-[3.4cqw] w-[3.4cqw]" style={{ color: MUTED }} />
      </span>
      <span className="relative min-w-0 flex-1 text-[3.4cqw]">
        <motion.span
          style={{ opacity: placeholderOpacity, color: MUTED }}
          className="block truncate"
        >
          {placeholder}
        </motion.span>
        <motion.span
          style={{ opacity: valueOpacity, x: valueX, color: TEXT }}
          className="absolute inset-0 block truncate font-semibold"
        >
          {value}
        </motion.span>
      </span>
      <ChevronRight
        className="h-[3.4cqw] w-[3.4cqw] shrink-0"
        style={{ color: MUTED }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2 — Posted                                                          */
/* ------------------------------------------------------------------ */

function Posted({ p }: { p: MotionValue<number> }) {
  const opacity = useTransform(p, [0.63, 0.67, 0.73, 0.77], [0, 1, 1, 0]);
  const scale = useTransform(p, [0.63, 0.67, 0.73, 0.77], [0.9, 1, 1, 0.96]);
  const tick = useTransform(p, [0.66, 0.7], [0, 1]);

  return (
    <motion.div
      style={{ opacity, scale, backgroundColor: CARD }}
      className="absolute left-[-4cqw] top-[62cqw] w-[108cqw] rounded-[6cqw] p-[6cqw] text-center shadow-[0_2cqw_5cqw_-1cqw_rgba(0,0,0,0.85)] ring-1 ring-white/12"
    >
      <motion.span
        style={{ scale: tick, backgroundColor: TEAL }}
        className="mx-auto flex h-[14cqw] w-[14cqw] items-center justify-center rounded-full"
      >
        <Check className="h-[7cqw] w-[7cqw] text-[#04211d]" strokeWidth={3} />
      </motion.span>
      <p className="mt-[4cqw] text-[5.4cqw] font-bold" style={{ color: TEXT }}>
        Hustle posted
      </p>
      <p className="mt-[1.6cqw] text-[3.4cqw] leading-snug" style={{ color: MUTED }}>
        Hustlers nearby can see it now. You will get a notification the
        moment someone applies.
      </p>
      <div className="mt-[4cqw] flex items-center justify-center gap-[2cqw] rounded-[3.4cqw] py-[3cqw] text-[3.4cqw] font-semibold" style={{ backgroundColor: CHIP, color: "#5eead4" }}>
        <Users className="h-[3.6cqw] w-[3.6cqw]" />
        3 Hustlers applied
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* 3 — Paid out                                                        */
/* ------------------------------------------------------------------ */

function Payout({ p }: { p: MotionValue<number> }) {
  const opacity = useTransform(p, [0.95, 0.99], [0, 1]);
  const y = useTransform(p, [0.95, 0.99], ["14%", "0%"]);
  const scale = useTransform(p, [0.95, 0.99], [0.94, 1]);

  return (
    <motion.div
      style={{ opacity, y, scale, backgroundColor: TEAL }}
      className="absolute left-[-15cqw] top-[62cqw] w-[130cqw] overflow-hidden rounded-[6cqw] text-left shadow-[0_2cqw_5cqw_-1cqw_rgba(0,0,0,0.8)]"
    >
      <div className="flex items-start justify-between gap-[3cqw] p-[5cqw]">
        <span className="flex items-center gap-[2.6cqw]">
          <span className="flex h-[10cqw] w-[10cqw] items-center justify-center rounded-full bg-[#04211d]/12">
            <BadgeCheck className="h-[5.6cqw] w-[5.6cqw]" style={{ color: "#04211d" }} />
          </span>
          <span>
            <span className="block text-[5cqw] font-bold leading-tight" style={{ color: "#04211d" }}>
              Paid out
            </span>
            <span className="block text-[3.2cqw] font-semibold text-[#065f52]">
              Released!
            </span>
          </span>
        </span>
        <span className="text-right">
          <span className="block text-[5cqw] font-bold leading-tight" style={{ color: "#04211d" }}>
            ₦3,000
          </span>
          <span className="block text-[3.2cqw] text-[#04211d]/70">to Wallet</span>
        </span>
      </div>

      <PayoutRow label="Hustle" value="Help me move a box" />
      <PayoutRow label="When" value="Jan 25, 12:32 PM" />
    </motion.div>
  );
}

function PayoutRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-[3cqw] border-t border-[#04211d]/10 bg-[#04211d]/8 px-[5cqw] py-[3.4cqw] text-[3.4cqw]">
      <span style={{ color: "#04211d" }}>{label}</span>
      <span className="font-semibold" style={{ color: "#04211d" }}>
        {value}
      </span>
    </div>
  );
}
