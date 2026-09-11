"use client";

import { motion } from "framer-motion";
import { Ban, Lock, Phone, ShieldCheck, TriangleAlert } from "lucide-react";
import Image from "next/image";
import { PhoneFrame, PhoneScreen } from "@/components/home/PhoneFrame";

/**
 * The trust grid.
 *
 * The reference puts its one big claim over an asymmetric grid — a wide
 * card, a tall card, two small ones — so no two cards read as equal in
 * weight. Same layout here, carrying the four things that make a job
 * between strangers safe enough to start.
 */

function Card({
  className = "",
  delay = 0,
  children,
}: {
  className?: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.75, delay, ease: [0.19, 1, 0.22, 1] }}
      className={`glass-card ${className}`}
    >
      <div className="glass-card__wash" />
      {children}
    </motion.div>
  );
}

export function FeatureGrid() {
  return (
    <section id="safety" className="relative scroll-mt-24 px-6 py-[11vh]">
      <div className="mx-auto max-w-[72rem]">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
          className="t-h2 mx-auto max-w-[44rem] text-balance text-center"
        >
          Built so <span className="t-accent">both sides</span> can trust it.
        </motion.h2>

        <div className="mt-[6vh] grid gap-4 md:grid-cols-3">
          {/* Wide — the conversation. */}
          <Card className="p-7 md:col-span-2 md:col-start-1 md:row-start-1">
            <div className="relative">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--accent)]/15 text-[color:var(--accent-bright)]">
                <Phone className="h-5 w-5" />
              </span>
              <h3 className="t-h4 mt-5 text-white">
                Agree the price. Lock it in.
              </h3>
              <p className="t-body mt-3 max-w-[34rem]">
                Message or call the other person inside the Hustle itself. The
                asking price is a starting point. Settle on a number in chat, and
                the money locks before any work begins.
              </p>

              <div className="mt-7 space-y-2.5">
                <div className="ml-auto w-fit max-w-[70%] rounded-2xl rounded-br-md bg-[color:var(--accent)] px-4 py-2.5 text-sm text-[#04211d]">
                  Can you do ₦3,500 if I bring the parts?
                </div>
                <div className="w-fit max-w-[70%] rounded-2xl rounded-bl-md bg-white/8 px-4 py-2.5 text-sm text-white">
                  That works. Send it through and I&apos;ll start at 4.
                </div>
                <div className="flex items-center gap-2 pt-1.5 text-xs text-[color:var(--accent-tint)]">
                  <Lock className="h-3.5 w-3.5" />
                  ₦3,500 held in escrow
                </div>
              </div>
            </div>
          </Card>

          {/* Tall — the feed. */}
          <Card className="overflow-hidden p-7 md:col-start-3 md:row-span-2 md:row-start-1" delay={0.08}>
            <div className="relative flex h-full flex-col">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--accent)]/15 text-[color:var(--accent-bright)]">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <h3 className="t-h4 mt-5 text-white">
                Paid work, nearest first.
              </h3>
              <p className="t-body mt-3">
                Open the Feed and take the Hustles closest to you. Every one
                shows the location, the timing and the offer before you apply.
              </p>
              {/* At one column this card is short, so the device needs a
                  floor of its own rather than whatever the row leaves. */}
              <div className="relative mt-8 min-h-[15rem] flex-1 overflow-hidden">
                <div className="absolute inset-x-0 top-0 mx-auto w-[min(56vw,205px)]">
                  <PhoneFrame>
                    <PhoneScreen
                      src="/app/feed.webp"
                      alt="The sydHustle feed showing open Hustles nearby, each with a verified poster, a location, a time and an offer"
                    />
                  </PhoneFrame>
                </div>
              </div>
            </div>
          </Card>

          {/* Two small — escrow and safety. */}
          <Card className="p-7" delay={0.12}>
            <div className="relative">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--accent)]/15 text-[color:var(--accent-bright)]">
                <Lock className="h-5 w-5" />
              </span>
              <h3 className="t-h4 mt-5 text-white">Nobody pays on trust.</h3>
              <p className="t-body mt-3">
                Funds sit in escrow from the moment the price is agreed until
                the person who posted the Hustle marks it done.
              </p>
            </div>
          </Card>

          <Card className="p-7" delay={0.16}>
            <div className="relative">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--accent)]/15 text-[color:var(--accent-bright)]">
                <Ban className="h-5 w-5" />
              </span>
              <h3 className="t-h4 mt-5 text-white">One tap to end it.</h3>
              <p className="t-body mt-3">
                Identity verification on both sides, a rating after every job,
                and report or block without leaving the conversation.
              </p>
            </div>
          </Card>

          {/* Wide again, on its own row: the panic button lives on a
              Live Activity, which is a 3:1 strip. Dropping it into a
              single column would crop away the part worth showing. */}
          <Card className="p-7 md:col-span-3" delay={0.2}>
            <div className="relative grid items-center gap-7 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
              <div>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#ef4444]/15 text-[#f87171]">
                  <TriangleAlert className="h-5 w-5" />
                </span>
                <h3 className="t-h4 mt-5 text-white">
                  A panic button you never have to unlock for.
                </h3>
                <p className="t-body mt-3">
                  While a Hustle is running, a Live Activity sits on the lock
                  screen with the distance, the arrival time and the street it
                  is happening on. The panic button is on it. One tap raises
                  the alarm without opening the app, or even unlocking the
                  phone.
                </p>
              </div>

              <div className="overflow-hidden rounded-[1.1rem] ring-1 ring-inset ring-white/10">
                <Image
                  src="/panic-live-activity.png"
                  alt="The sydHustle Live Activity on an iPhone lock screen: three minutes away, arriving 13:48, with a red Panic button and a progress bar showing the Hustler on the way"
                  width={1139}
                  height={367}
                  sizes="(max-width: 1024px) 88vw, 36rem"
                  quality={88}
                  className="h-auto w-full"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
