"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ShieldCheck, Store, Users } from "lucide-react";

/**
 * The problem, and the answer to it.
 *
 * The page has been black for four screens by the time you arrive here,
 * so this one inverts: a single saturated colour, white type on it. It
 * is the only colour on the page, which is what lets it carry the one
 * argument the product screens cannot make on their own.
 *
 * The ground is the brand teal rather than the device's own colour. The
 * frame in the render is a very dark green — #183020 at the rails — and
 * a section painted in it would sit a couple of steps from the #050506
 * either side of it.
 *
 * The light is centred low, behind the device rather than behind the
 * copy: the phone is a dark object with a dark screen, and standing it
 * in the falloff instead of in the pool leaves it muddy.
 *
 * The layout is two movements. The problem is three parallel cases, so
 * it is set as three columns of equal weight — none of them is the
 * headline argument, they compound. The answer is a single object with
 * three consequences, so it pairs the device against a stacked list:
 * the eye lands on the phone, then reads down.
 */

const PROBLEMS = [
  {
    n: "01",
    head: "A skill with no shopfront earns nothing.",
    body: "A student who can barber, tailor, repair phones, braid hair, or take photographs has something people around them will pay for. What they do not have is the capital for physical premises: rent, a deposit, a counter, a sign. Without somewhere to be found, the skill simply sits idle through years when the money is most needed.",
  },
  {
    n: "02",
    head: "A shopfront without footfall earns almost as little.",
    body: "The few who do manage premises are usually on a quiet street rather than a busy road, because that is what they could afford. They spend the day waiting for customers who never walk past. The problem is not their work. It is that nobody knows they are there.",
  },
  {
    n: "03",
    head: "Most people have no trade at all, just free time and willingness.",
    body: "This is the largest group by far. They are short of money for food and basic upkeep, they are ready to do honest work, and there is no route to it: no listings, no way to be found, no way to be paid safely. That vacuum is what makes illegal work look like the only option available at the speed it is needed. Not because anyone prefers it, but because nothing legitimate is reachable.",
  },
];

const ANSWERS = [
  {
    icon: Store,
    head: "It replaces the shopfront with a listing.",
    body: "A Hustler publishes what they do and where they will travel. Being found no longer costs rent. The Skills tab and the Hustle Feed put them in front of people nearby who are looking right now. Someone with a physical store gets the same reach without moving to a busier street.",
  },
  {
    icon: Users,
    head: "It gives untrained willingness somewhere to go.",
    body: "Everyday Hustles need no listing and no skill: a Provider posts what they need doing and what they will pay, and anyone nearby can take it. Someone with free time and no trade can start earning from the first day, on work they choose, at a price they agreed.",
  },
  {
    icon: ShieldCheck,
    head: "It makes the money safe on both sides.",
    body: "Payment is locked before work begins and released when the Provider confirms it is done. The Hustler knows the money exists before travelling; the Provider knows it is not gone until the work is. Neither has to trust a stranger with cash, which is the thing that stops most of these arrangements before they start.",
  },
];

const rise = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
};

export function Coverage() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(115%_82%_at_50%_72%,#12897a_0%,#0a5750_44%,#062724_100%)] text-white">
      <div className="mx-auto max-w-[76rem] px-6 pt-[12vh]">
        {/* The problem ------------------------------------------------ */}
        <motion.div {...rise} transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}>
          <p className="t-eyebrow text-[color:var(--accent-tint)]">
            The problem we want to solve
          </p>
          <h2 className="mt-4 max-w-[54rem] text-balance text-[clamp(1.75rem,3.05vw,2.85rem)] font-medium leading-[1.14] tracking-[-0.022em] text-white">
            Three things compound, and each one wastes the same thing: capable
            people with time on their hands and no way to convert that into
            money.
          </h2>
        </motion.div>

        <ol className="mt-[7vh] grid gap-x-10 gap-y-10 border-t border-white/15 pt-10 md:grid-cols-3">
          {PROBLEMS.map((p, i) => (
            <motion.li
              key={p.n}
              {...rise}
              transition={{
                duration: 0.7,
                delay: i * 0.08,
                ease: [0.19, 1, 0.22, 1],
              }}
            >
              <span className="block text-[0.8rem] font-semibold tracking-[0.18em] text-[color:var(--accent-tint)]">
                {p.n}
              </span>
              <h3 className="mt-3 text-balance text-[clamp(1.15rem,1.45vw,1.45rem)] font-medium leading-[1.3] text-white">
                {p.head}
              </h3>
              <p className="mt-3 text-[length:var(--fs-body)] leading-[1.6] text-white/72">
                {p.body}
              </p>
            </motion.li>
          ))}
        </ol>
      </div>

      {/* The answer --------------------------------------------------- */}
      <div className="mx-auto mt-[12vh] grid max-w-[80rem] items-center gap-x-14 gap-y-[6vh] px-6 pb-[11vh] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/*
          The device. Portrait and carrying a real alpha channel, so it
          composites straight onto the ground — no plate edge to hide and
          no matte to key.
        */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.9, ease: [0.19, 1, 0.22, 1] }}
          className="mx-auto w-[min(88vw,30rem)] lg:mx-0 lg:w-full lg:max-w-[34rem]"
        >
          <Image
            src="/coverage-phone.png"
            alt="The sydHustle app open on the Home screen, showing the Hustle composer and past Hustles."
            width={941}
            height={1672}
            sizes="(max-width: 1024px) 88vw, 34rem"
            quality={88}
            className="h-auto w-full"
          />
        </motion.div>

        <div>
          <motion.p
            {...rise}
            transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
            className="t-eyebrow text-[color:var(--accent-tint)]"
          >
            What sydHustle does about it
          </motion.p>

          <ul className="mt-7 space-y-9">
            {ANSWERS.map((a, i) => (
              <motion.li
                key={a.head}
                {...rise}
                transition={{
                  duration: 0.7,
                  delay: i * 0.08,
                  ease: [0.19, 1, 0.22, 1],
                }}
                className="flex gap-4"
              >
                <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[color:var(--accent-tint)] ring-1 ring-inset ring-white/15">
                  <a.icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <div>
                  <h3 className="text-balance text-[clamp(1.15rem,1.4vw,1.4rem)] font-medium leading-[1.3] text-white">
                    {a.head}
                  </h3>
                  <p className="mt-2.5 text-[length:var(--fs-body)] leading-[1.6] text-white/72">
                    {a.body}
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
