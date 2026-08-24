import type { Metadata } from "next";

import { Footer } from "@/components/Footer";
import { Clause, LegalCard, Sub, Term } from "@/components/legal";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Community Standards",
  description:
    "What is and isn't allowed on sydHustle, how content is moderated, how to report and block, and how enforcement and appeals work.",
  alternates: { canonical: "/policies_center/community_standard" },
};

/**
 * The Community Standards, the user-facing statement of the rules the
 * moderation pipeline actually enforces.
 *
 * Written from the enforcement machinery that exists (pre-publish
 * filters, the report taxonomy, the block flow, the enforcement ladder
 * and appeals), not aspirationally: Apple Guideline 1.2 and Google's
 * UGC policy both expect the published standards, the in-app report
 * reasons and the moderation process to describe the same system.
 */

const EFFECTIVE_DATE = "13 August 2026";

export default function CommunityStandardsPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 pb-24 pt-28 md:pt-32">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            Policies Center
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Community Standards
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Effective date: {EFFECTIVE_DATE} · Version 1.0
          </p>

          <LegalCard>
            sydHustle works because strangers can trust each other enough to
            hire, get hired, and meet. These Community Standards set out what
            is not allowed on the platform, how we enforce the rules, and
            what to do when you see something that breaks them. They form
            part of our{" "}
            <a
              className="text-accent underline-offset-4 hover:underline"
              href="/legal/terms"
            >
              Terms &amp; Conditions
            </a>{" "}
            and apply to everything you post, list, message or review,
            including private one-to-one chats.
          </LegalCard>

          <Clause number="1" title="Be Who You Say You Are">
            <p>
              Accounts must belong to real people using their real identity.
              You must not impersonate any person, verify an account with
              documents that are not your own, misrepresent your skills,
              experience or credentials, or operate more than one account. A
              verification badge means a government-issued ID was checked
              against the name on the account, claiming qualifications you
              do not hold is a violation even on a verified account.
            </p>
          </Clause>

          <Clause number="2" title="Keep It Lawful">
            <p>
              You must not post, request, offer or perform anything illegal,
              including fraudulent schemes, scams, stolen goods, prohibited
              substances, or services that require a licence you do not hold.
              Using the platform to launder money or to defraud anyone will
              lead to permanent removal and, where the law requires, referral
              to law enforcement.
            </p>
          </Clause>

          <Clause number="3" title="Respect Other People">
            <p>
              No harassment, bullying, threats, hate speech or discrimination
              in Hustle posts, listings, reviews or messages. Disagreements
              about work happen; abuse is never the way through them. Content
              that sexualises, exploits or endangers anyone is removed and
              the account actioned. Explicit sexual content and solicitation
              are not allowed anywhere on the platform.
            </p>
          </Clause>

          <Clause number="4" title="Keep Money on the Platform">
            <Sub n="4.1">
              Payment for work arranged through sydHustle must go through
              sydHustle. Soliciting or agreeing to be paid outside the app,
              to avoid fees or otherwise, strips both sides of Escrow
              protection and the dispute process, and is a violation for the
              person who proposes it.
            </Sub>
            <Sub n="4.2">
              For the same reason, do not publish phone numbers, email
              addresses, social-media handles or exact addresses in public
              fields (Hustle posts, Skill listings, profiles, reviews) to
              route conversations off the app. Contact details are exchanged
              where the platform provides for it, once an engagement is
              underway.
            </Sub>
          </Clause>

          <Clause number="5" title="Keep the Marketplace Honest">
            <p>
              No spam, no repeated identical postings, and no posts that are
              not genuine offers or requests for work. Reviews must reflect a
              real transaction you were part of: fake, incentivised,
              retaliatory or traded reviews are removed, and manipulating
              ratings, impressions or placement is a violation. Prices must
              be stated honestly, a listing is not a bait for a different
              deal in chat.
            </p>
          </Clause>

          <Clause number="6" title="Stay Safe In Person">
            <p>
              Meet where the engagement reasonably requires, be punctual, and
              keep the arrangement to what was agreed in the app, the
              conversation record is what protects you both. Never ask
              someone to meet before payment is locked, and never pressure
              anyone into sharing an address the platform has not yet
              disclosed. If you register as a Hustler, keep your emergency
              contact up to date; it is used only in a safety emergency.
            </p>
          </Clause>

          <Clause number="7" title="How Moderation Works">
            <Sub n="7.1">
              <Term>Before publication.</Term> Hustle posts and messages pass
              through automated screening before they become visible,
              checking for prohibited content, contact details in public
              fields, and off-platform payment solicitation. Content that
              fails is never published; attempting it repeatedly is itself
              recorded.
            </Sub>
            <Sub n="7.2">
              <Term>After a report.</Term> Every report goes into a review
              queue with a snapshot of the reported content, so it can be
              assessed even if edited or deleted afterwards. Reports are
              reviewed by a person, with safety-critical reports, threats,
              suspected illegal activity, prioritised. You are notified when
              your report is resolved.
            </Sub>
            <Sub n="7.3">
              <Term>Enforcement is proportional.</Term> Depending on
              severity and history: a warning; removal of the content;
              temporary suspension of posting or messaging; or permanent
              account termination. Fraud, exploitation and threats to safety
              skip the ladder. Every enforcement action is logged.
            </Sub>
            <Sub n="7.4">
              <Term>Appeals.</Term> If your content is removed or your
              account is actioned, you can appeal in the app, including
              appealing a review you believe violates these Standards. Each
              appeal is decided by a person and the outcome recorded, either
              way.
            </Sub>
          </Clause>

          <Clause number="8" title="Reporting and Blocking">
            <Sub n="8.1">
              A <Term>Report</Term> action is available on every profile,
              Hustle post, Skill listing, review and message thread. Choose
              the reason that fits, spam or scam, harassment, hate speech,
              explicit content, impersonation, off-platform payment, illegal
              activity, or other, and add detail if you can.
            </Sub>
            <Sub n="8.2">
              <Term>Block</Term> is available on every profile and message
              thread. Blocking hides the other person&rsquo;s content from
              you, prevents messages in both directions, and is never
              disclosed to them. You can unblock at any time in Settings.
            </Sub>
            <Sub n="8.3">
              If someone is in immediate danger, contact local emergency
              services first, then report to us.
            </Sub>
          </Clause>

          <Clause number="9" title="Contact">
            <p>
              To raise anything these Standards cover, or to report content
              you cannot report in-app, reach us at{" "}
              <a
                className="text-accent underline-offset-4 hover:underline"
                href="mailto:support@sydhustle.com"
              >
                support@sydhustle.com
              </a>{" "}
              or on WhatsApp at{" "}
              <a
                className="text-accent underline-offset-4 hover:underline"
                href="https://wa.me/2347088569014"
                rel="noopener noreferrer"
                target="_blank"
              >
                0708&nbsp;856&nbsp;9014
              </a>
              . This channel is monitored.
            </p>
          </Clause>

          <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm leading-6 text-muted-foreground">
            <span className="font-semibold text-foreground">
              SydHustle Limited
            </span>{" "}
            · RC 9677465 · These Standards form part of the{" "}
            <a
              className="text-accent underline-offset-4 hover:underline"
              href="/legal/terms"
            >
              Terms &amp; Conditions
            </a>
            .
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
