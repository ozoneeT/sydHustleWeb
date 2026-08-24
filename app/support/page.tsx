import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { feeTierSentence, listFeeTiersSafe } from "@/lib/console/fee-tiers";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Get help with sydHustle: escrow and withdrawals, identity verification, disputes and reports, and your account.",
  alternates: { canonical: "/support" },
};

/**
 * The support page, and the address the App Store listing points at.
 *
 * Apple requires a Support URL that resolves to a real page carrying at
 * least one live contact method. A mailto: link is not accepted in that
 * field, and a placeholder or a coming-soon page is a rejection, so this
 * page is a submission requirement rather than a nicety. Google Play
 * takes the email address on its own, in its own field.
 *
 * The answers are the same ones bundled into the app's help screen
 * (src/features/support/data/help-topics.ts in the sydHustle repo).
 * Someone who cannot open the app, because their data has run out or
 * because they are locked out of their account, is exactly the person
 * who needs them, and they should not have to get past the thing that is
 * broken to read them. If the in-app copy changes, change it here too.
 */

/**
 * The release fee rates are set from the console and change without a
 * deploy, so the fees answer carries a placeholder and the page fills it
 * in at render. Same token, same substitution and the same fallback as
 * the app's help screen, which is what keeps the two readings of the
 * rate card identical.
 */
const FEE_TIERS_TOKEN = "{RELEASE_FEE_TIERS}";

const SECTIONS: { group: string; topics: { q: string; a: string }[] }[] = [
  {
    group: "Money",
    topics: [
      { q: "Where is my money? My balance looks short", a: "When you pay for a Hustle or a Skill, the amount leaves your available balance and is held in escrow - it belongs to neither side until the work is done. You'll see it under “In motion” on the Wallet. It is released to the Hustler when you confirm the work is complete, or by a decision if a dispute is raised." },
      { q: "When does the Hustler actually get paid?", a: "The moment you confirm the work is done. If you neither confirm nor raise a dispute after the Hustler marks it complete, we may release the payment after giving you notice - otherwise a Hustler could be left unpaid indefinitely by someone simply not answering." },
      { q: "What does sydHustle charge?", a: "One fee, and only the Hustler pays it: a service fee taken from the payment when a Hustle is released. It slides with the size of the work - {RELEASE_FEE_TIERS} - so bigger jobs are charged proportionally less. You are told what you'll receive before you accept a price, and the receipt for every release shows the exact fee taken. Withdrawing your money is free. sydHustle charges nothing to send it to your bank and covers the transfer cost itself. On transfers of ₦10,000 or more your bank's ₦50 stamp duty applies - that is a government levy, not our fee, and it is the same ₦50 you would pay sending that amount yourself. If a Hustle is cancelled or refunded after the money was locked, a 5% escrow administration fee applies instead. Rates can change; whatever is shown to you before you agree a price is what applies to that Hustle." },
      { q: "My withdrawal hasn't arrived", a: "Withdrawals go to the bank account registered in your Wallet, and bank transfers in Nigeria can take a few hours. First check the account details are the right ones - a wrong account number is the commonest cause. If the money has left your sydHustle balance and hasn't landed after a day, message us with the date and amount." },
      { q: "How do I see everything that has moved?", a: "Wallet → See all shows every payment, hold, release and withdrawal on your account, newest first. Tap any row for its reference, which is what to quote if you contact us about it." },
    ],
  },
  {
    group: "Getting verified",
    topics: [
      { q: "Why do I have to verify my identity?", a: "Because sydHustle sends strangers to each other's homes and moves money between them. Verification checks your NIN against the national record so that the person on the other side of a booking is a real, traceable person. You need it to offer a Skill, to apply for a Hustle, and to withdraw." },
      { q: "It says my NIN is already verified on another account", a: "One person, one account - a NIN can only be verified on a single sydHustle account at a time. If the other account is an old one of yours, message us from the email address on the account you want to keep and we'll release it. If it isn't yours, tell us straight away: someone has used your NIN." },
      { q: "It says too many attempts, try again tomorrow", a: "Verification allows three failed attempts a day, to stop people guessing at somebody else's details. Wait until tomorrow and try again with the details exactly as they appear on your NIN record. If you're certain they're right and it still refuses, message us rather than burning the next day's attempts." },
      { q: "My details don't match my NIN", a: "The name, date of birth and state have to match the national record, not what you usually go by - a middle name you never use, or a spelling the registry has differently, will fail the check. Enter them exactly as registered. If the record itself is wrong, that has to be corrected at NIMC before we can verify you." },
    ],
  },
  {
    group: "Work and disputes",
    topics: [
      { q: "The work wasn't done, or wasn't done properly", a: "Don't confirm completion. Open the Hustle or booking in Messages and raise a dispute there - the money stays locked in escrow while it's open. We review the conversation and whatever both sides send, decide where the escrowed money goes, and you can appeal that decision in the app. Keep everything in the chat: it is the record the decision is made on." },
      { q: "I need to cancel", a: "Before you pay, either side can walk away at no cost. Once the money is locked and before the work starts, you can cancel and the amount returns to your Wallet less the 5% escrow fee - which we may waive if the cancellation is the Hustler's doing. Once work has started, agree the split in the chat, or raise a dispute if you can't." },
      { q: "Someone is behaving badly", a: "Every profile, Hustle, Skill, review and message thread has a Report action in its ⋯ menu - use it, and pick the reason that fits, because a reported item comes to us with the content attached even if it's deleted afterwards. You can also block someone from their profile: they aren't told, and they can't message you again. If anyone is in immediate danger, call the emergency services first." },
      { q: "Someone asked me to pay outside the app", a: "Don't. Paying outside sydHustle means no escrow, no dispute process and no way for us to get your money back - which is exactly why people ask, and it is the commonest shape a scam takes here. It's also against the Terms for the person who asked, so report it. Nobody from sydHustle will ever ask for your password or a bank PIN." },
    ],
  },
  {
    group: "Your account",
    topics: [
      { q: "How do I change my phone number or email?", a: "Your phone number and email are tied to your verified account, so they can't be edited in the app - that's what stops someone taking over an account by changing where its codes go. Message us from the address currently on the account and we'll change it." },
      { q: "I'm getting too many notifications", a: "Mute them for a while instead of turning them off for good - silence the buzzing without losing anything. Press and hold the bell on Home, or press and hold the sydHustle icon on your Home Screen without opening the app at all, and pick one hour, eight hours, or until you turn it back on. If you want to turn off a particular kind of alert for good rather than pause the lot, Settings lets you choose which kinds reach you. The three mute lengths are also in Settings → Mute, which is where to look if you would rather not hunt for a press-and-hold. While you are muted everything still arrives in your notification list - your phone simply stays quiet. Payments landing and someone arriving for a Hustle always break through, so muting can never cost you money or leave a person waiting at the door." },
      { q: "I'm not getting notifications", a: "First check you haven't muted them - Settings → Mute says so plainly if you have, and a mute you set days ago and forgot is the commonest reason for this. Then check they're allowed for sydHustle in your phone's own settings: if they were declined once, the app can't ask again. Settings inside the app also lets you choose which kinds reach you. Either way nothing is lost - you'll see it all next time you open the app." },
      { q: "Distances and nearby Hustles aren't showing", a: "That needs location permission, which you can grant or revoke in your phone's settings at any time. Without it everything still works - the distance labels are simply left off. We only ever use an approximate position, and your exact address is never shown to anyone browsing." },
      { q: "How do I delete my account?", a: "Profile → Delete account. You'll be stopped if you have an open Hustle, an accepted application or money in escrow - those have to be settled first, because deleting an account cannot be a way to walk away from work or a payment. Transaction and identity records are kept afterwards for the period the law requires." },
    ],
  },
];

const SUPPORT_EMAIL = "support@sydhustle.com";
const WHATSAPP_URL = "https://wa.me/2347088569014";

/**
 * Rebuilt hourly, and immediately whenever the console saves a new rate
 * card (`revalidatePath("/support")` in lib/console/fee-tier-actions.ts).
 *
 * This page is the Support URL on the App Store listing, so it has to
 * render whether or not the database answers - hence `listFeeTiersSafe`,
 * which falls back to the card this build shipped with rather than
 * throwing. A rate card an hour behind is a small wrong; a support page
 * that 500s is a rejected submission.
 */
export const revalidate = 3600;

export default async function SupportPage() {
  const liveFeeTiers = feeTierSentence(await listFeeTiersSafe());

  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 pb-24 pt-28 md:pt-32">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            Support
          </p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl">
            Something not working? Start here.
          </h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            The questions below are the ones we are actually asked, answered
            with what sydHustle actually does. If yours is not here, or your
            money or your account is involved, write to us and a person will
            read it.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              className="rounded-full bg-accent px-5 py-3 text-sm font-bold text-background transition-opacity hover:opacity-90"
              href={`mailto:${SUPPORT_EMAIL}`}
            >
              Email {SUPPORT_EMAIL}
            </a>
            <a
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-foreground transition-colors hover:border-accent/40"
              href={WHATSAPP_URL}
              rel="noreferrer"
              target="_blank"
            >
              WhatsApp us
            </a>
          </div>

          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Include the reference from the transaction if it is about money.
            Wallet, then See all, then tap the row: the reference is what lets
            us find it without asking you for anything else.
          </p>

          {SECTIONS.map((section) => (
            <section key={section.group}>
              <p className="mt-14 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {section.group}
              </p>
              <div className="mt-6 space-y-5">
                {section.topics.map((topic) => (
                  <details
                    className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-accent/40"
                    key={topic.q}
                  >
                    <summary className="cursor-pointer list-none text-base font-bold tracking-tight text-foreground group-open:text-accent">
                      {topic.q}
                    </summary>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {topic.a.split(FEE_TIERS_TOKEN).join(liveFeeTiers)}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          ))}

          <p className="mt-16 text-sm leading-6 text-muted-foreground">
            The rules themselves, the Terms, the Privacy Policy and the
            Community Standards, live in the{" "}
            <Link
              className="text-accent underline-offset-4 hover:underline"
              href="/policies_center"
            >
              Terms and Policies
            </Link>{" "}
            hub.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
