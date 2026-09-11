"use client";

import { MotionValue, motion, useTransform } from "framer-motion";
import {
  ArrowRight,
  Bell,
  Check,
  Clock,
  Lock,
  ChevronLeft,
  CreditCard,
  Compass,
  Home,
  MessageCircle,
  MoreVertical,
  Plus,
  Search,
  Send,
  Smile,
} from "lucide-react";

/**
 * The app, running inside the hero's device.
 *
 * Not a screenshot — a rebuild of the real screens in DOM, driven by the
 * same scroll progress as the device around it. The device is scaled
 * past 2× at the top of the page, where any bitmap would go soft, and
 * the point of the shot is the *sequence*: a Hustle posted, matched and
 * paid for.
 *
 * The three scenes stack rather than cross-fade in and out. Each one is
 * opaque and the next simply covers it, so at no point in the scroll can
 * the empty screen behind them show through.
 *
 * Every size is in `cqw`, against the query container on the frame, so
 * the interface holds its proportions at any window size and at any
 * point in the zoom.
 */

/*
 * The app's own dark palette, taken off a capture of the Home screen:
 * a near-black green ground, cards a step above it, fields a step above
 * those, and the brand teal for anything live.
 */
const TEAL = "#14b8a6";
const GROUND = "#04201d";
const CARD = "#0a2a26";
const CHIP = "#12403a";
const TEXT = "#e6f4f1";
const MUTED = "#7fa39c";

/** Sub-range helper: maps a window of the page progress onto 0 → 1. */
function useBeat(p: MotionValue<number>, from: number, to: number) {
  return useTransform(p, [from, to], [0, 1], { clamp: true });
}

export function AppSimulator({ p }: { p: MotionValue<number> }) {
  /* Two scenes, stacked rather than cross-faded: the first is the base
     and never fades, so the empty screen behind them can never show. */
  const chat = useTransform(p, [0.74, 0.79], [0, 1]);

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: GROUND, color: TEXT }}
      aria-hidden
    >
      <ScenePost />
      <motion.div style={{ opacity: chat }} className="absolute inset-0">
        <SceneChat p={p} />
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Chrome                                                              */
/* ------------------------------------------------------------------ */

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-[6cqw] pt-[3.4cqw] text-[3.4cqw] font-semibold text-white">
      <span>9:41</span>
      <span className="flex items-center gap-[1.4cqw]">
        <span className="flex items-end gap-[0.5cqw]">
          {[1.4, 2, 2.6, 3.2].map((h) => (
            <span
              key={h}
              className="w-[0.9cqw] rounded-[0.3cqw] bg-current"
              style={{ height: `${h}cqw` }}
            />
          ))}
        </span>
        <span className="h-[3cqw] w-[5.6cqw] rounded-[1cqw] border border-current p-[0.5cqw]">
          <span className="block h-full w-[70%] rounded-[0.5cqw] bg-current" />
        </span>
      </span>
    </div>
  );
}

function TabBar() {
  const items = [
    { icon: Home, label: "Home", on: true },
    { icon: Compass, label: "Skills", on: false },
    { icon: MessageCircle, label: "Messages", on: false },
    { icon: CreditCard, label: "Wallet", on: false },
  ];
  return (
    <div className="absolute inset-x-[4cqw] bottom-[2.5cqw]">
      <div
        className="flex items-center justify-around rounded-[8cqw] border border-white/8 px-[3cqw] py-[2.6cqw]"
        style={{ backgroundColor: "#0c2a26" }}
      >
        {items.map((item) => (
          <span
            key={item.label}
            className="flex flex-col items-center gap-[0.8cqw] text-[2.7cqw] font-medium"
            style={{ color: item.on ? "#2dd4bf" : MUTED }}
          >
            <item.icon className="h-[4.6cqw] w-[4.6cqw]" />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1 — Post a Hustle                                                   */
/* ------------------------------------------------------------------ */
/*
 * The composer itself is not in here — it breaks out past the edges of
 * the device and so is drawn on the page, in `HeroCards`. What stays on
 * the screen is the banner behind it.
 */

function ScenePost() {
  return (
    <div className="absolute inset-0" style={{ backgroundColor: GROUND }}>
      {/* The teal header, with the big rounded corners the app uses. */}
      <div
        className="rounded-b-[9cqw] pb-[7cqw]"
        style={{
          backgroundImage: "linear-gradient(180deg,#1c9e8e 0%,#15b3a0 100%)",
        }}
      >
        <StatusBar />

        <div className="mt-[3cqw] flex items-center justify-between px-[5cqw]">
          <span className="text-[7cqw] font-bold text-white/55">Home</span>
          <span className="flex items-center gap-[2.6cqw]">
            <span className="flex h-[9.4cqw] w-[9.4cqw] items-center justify-center rounded-full border border-white/35 bg-white/10">
              <Bell className="h-[4.4cqw] w-[4.4cqw] text-white" />
            </span>
            <span className="rounded-[6cqw] border border-white/35 bg-white/10 px-[4.4cqw] py-[2.2cqw] text-[3.9cqw] font-bold text-white">
              Hustles
            </span>
          </span>
        </div>

        <p className="mt-[5cqw] px-[5cqw] text-[2.9cqw] font-bold tracking-[0.24em] text-white/70">
          LET&apos;S GET IT DONE
        </p>

        <div className="mx-[5cqw] mt-[2.6cqw] flex items-center justify-center gap-[2.4cqw] rounded-[7cqw] border border-white/12 bg-[#0b3d33]/85 py-[4.6cqw] text-[4.4cqw] font-bold text-white">
          <Search className="h-[4.2cqw] w-[4.2cqw]" />
          Need a skilled Worker?
          <ArrowRight className="h-[4.2cqw] w-[4.2cqw]" />
        </div>

        <p className="mx-[6cqw] mt-[3.2cqw] text-center text-[3.1cqw] leading-snug text-white/80">
          Have something simpler? Just describe it in the composer below.
        </p>
      </div>

      {/* Below the composer, which docks in the gap under the header. */}
      <div className="absolute inset-x-[5cqw] bottom-[19cqw]">
        <p className="text-[4.4cqw] font-bold" style={{ color: TEXT }}>
          Hustle Histories
        </p>
        <div
          className="mt-[2.6cqw] flex flex-col items-center rounded-[5cqw] px-[4cqw] py-[4cqw] text-center"
          style={{ backgroundColor: CARD }}
        >
          <span
            className="flex h-[9cqw] w-[9cqw] items-center justify-center rounded-full"
            style={{ backgroundColor: CHIP }}
          >
            <Clock className="h-[4.4cqw] w-[4.4cqw]" style={{ color: MUTED }} />
          </span>
          <p className="mt-[2.6cqw] text-[3.6cqw] font-bold" style={{ color: TEXT }}>
            No Hustles yet
          </p>
          <p className="mt-[1cqw] text-[3cqw]" style={{ color: MUTED }}>
            Hustles you post will show up here.
          </p>
        </div>
      </div>

      <TabBar />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2 — The chat room                                                   */
/* ------------------------------------------------------------------ */
/*
 * Laid out the way the reference lays its chat out: back chevron,
 * avatar, name and overflow menu across the top; timestamped bubbles,
 * theirs dark and yours in the brand colour with a delivery tick; and a
 * composer bar along the bottom with an attach button, the message
 * field, and a round send key. Dark, as the reference's is.
 */

function SceneChat({ p }: { p: MotionValue<number> }) {
  const b = useBeat(p, 0.78, 0.99);

  const msg1 = useTransform(b, [0.04, 0.14], [0, 1]);
  const msg1Y = useTransform(b, [0.04, 0.14], [16, 0]);
  const msg2 = useTransform(b, [0.18, 0.28], [0, 1]);
  const msg2Y = useTransform(b, [0.18, 0.28], [16, 0]);
  const msg3 = useTransform(b, [0.32, 0.42], [0, 1]);
  const msg3Y = useTransform(b, [0.32, 0.42], [16, 0]);

  /* The step the money turns on: the person who posted the Hustle says
     the work is finished, and only then does escrow release. */
  const done = useTransform(b, [0.48, 0.58], [0, 1]);
  const doneY = useTransform(b, [0.48, 0.58], [22, 0]);
  const marked = useTransform(b, [0.66, 0.74], [0, 1]);
  const markBg = useTransform(marked, [0, 1], [CHIP, TEAL]);
  const markFg = useTransform(marked, [0, 1], [TEXT, "#04211d"]);
  const unmarked = useTransform(marked, [0, 1], [1, 0]);

  return (
    <div className="absolute inset-0 text-white"
      style={{ backgroundColor: GROUND }}>
      <StatusBar />

      <div className="mt-[2cqw] flex items-center gap-[3cqw] px-[4.5cqw] pb-[3.5cqw]">
        <ChevronLeft className="h-[5cqw] w-[5cqw] text-white/70" />
        <span
          className="h-[8cqw] w-[8cqw] rounded-full"
          style={{ backgroundColor: "#2f6f66" }}
        />
        <span className="flex-1 text-[4.2cqw] font-semibold">Chioma A.</span>
        <MoreVertical className="h-[4.6cqw] w-[4.6cqw] text-white/60" />
      </div>

      <div className="space-y-[3cqw] px-[4.5cqw] pt-[3cqw]">
        <motion.div
          style={{ opacity: msg1, y: msg1Y }}
          className="w-fit max-w-[78%] rounded-[4.5cqw] rounded-bl-[1.4cqw] bg-[#0d332e] px-[4cqw] py-[3cqw]"
        >
          <p className="text-[3.5cqw] leading-snug">
            I can be there in 20 minutes. Is ₦3,000 still good for the box?
          </p>
          <p className="mt-[1.6cqw] text-right text-[2.7cqw] text-white/40">
            12:30 PM
          </p>
        </motion.div>

        <motion.div
          style={{ opacity: msg2, y: msg2Y, backgroundColor: TEAL }}
          className="ml-auto w-fit max-w-[78%] rounded-[4.5cqw] rounded-br-[1.4cqw] px-[4cqw] py-[3cqw]"
        >
          <p className="text-[3.5cqw] leading-snug" style={{ color: "#04211d" }}>
            That works. Sending it through now.
          </p>
          <p
            className="mt-[1.6cqw] flex items-center justify-end gap-[1.2cqw] text-[2.7cqw]"
            style={{ color: "rgba(4,33,29,0.6)" }}
          >
            12:31 PM
            <DoubleTick />
          </p>
        </motion.div>

        <motion.div
          style={{ opacity: msg3, y: msg3Y }}
          className="w-fit max-w-[78%] rounded-[4.5cqw] rounded-bl-[1.4cqw] bg-[#0d332e] px-[4cqw] py-[3cqw]"
        >
          <p className="text-[3.5cqw] leading-snug">On my way 👍</p>
          <p className="mt-[1.6cqw] text-right text-[2.7cqw] text-white/40">
            12:32 PM
          </p>
        </motion.div>
      </div>

      {/* Marking the work done — the gate before any money moves. */}
      <motion.div
        style={{ opacity: done, y: doneY, backgroundColor: CARD }}
        className="absolute inset-x-[4.5cqw] bottom-[20cqw] rounded-[4.5cqw] p-[4cqw] ring-1 ring-white/8"
      >
        <p className="flex items-center gap-[2cqw] text-[3.6cqw] font-bold">
          <Lock className="h-[3.8cqw] w-[3.8cqw]" style={{ color: "#5eead4" }} />
          ₦3,000 held in escrow
        </p>
        <p className="mt-[1.2cqw] text-[3cqw] leading-snug" style={{ color: MUTED }}>
          Mark the Hustle done and the money goes to Chioma.
        </p>
        <motion.div
          style={{ backgroundColor: markBg, color: markFg }}
          className="relative mt-[3.4cqw] flex items-center justify-center gap-[1.8cqw] rounded-[3cqw] py-[3cqw] text-[3.4cqw] font-bold"
        >
          <motion.span style={{ opacity: unmarked }}>
            Mark Hustle as done
          </motion.span>
          <motion.span
            style={{ opacity: marked }}
            className="absolute inset-0 flex items-center justify-center gap-[1.6cqw]"
          >
            <Check className="h-[3.6cqw] w-[3.6cqw]" strokeWidth={3} />
            Marked done
          </motion.span>
        </motion.div>
      </motion.div>

      {/* Composer bar. */}
      <div className="absolute inset-x-[4cqw] bottom-[7cqw] flex items-center gap-[2.6cqw]">
        <span className="flex h-[9cqw] w-[9cqw] shrink-0 items-center justify-center rounded-full bg-[#0d332e]">
          <Plus className="h-[4.4cqw] w-[4.4cqw] text-white/75" />
        </span>
        <span className="flex flex-1 items-center gap-[2cqw] rounded-[6cqw] bg-[#0d332e] px-[4cqw] py-[2.8cqw]">
          <span className="flex-1 text-[3.4cqw] text-white/40">
            Write a message
          </span>
          <Smile className="h-[4cqw] w-[4cqw] text-white/40" />
        </span>
        <span
          className="flex h-[9cqw] w-[9cqw] shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: TEAL }}
        >
          <Send className="h-[4.2cqw] w-[4.2cqw] text-[#04211d]" />
        </span>
      </div>

      {/* Home indicator. */}
      <span className="absolute bottom-[2.4cqw] left-1/2 h-[0.9cqw] w-[30%] -translate-x-1/2 rounded-full bg-white/75" />
    </div>
  );
}

function DoubleTick() {
  return (
    <svg viewBox="0 0 20 12" className="h-[2.6cqw] w-[4.4cqw] fill-none stroke-current" strokeWidth={2.2}>
      <path d="M1 6.5 4.5 10 11 2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 6.5 12 10 18.5 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
