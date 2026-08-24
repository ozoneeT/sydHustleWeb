import type { Metadata } from "next";

import { Footer } from "@/components/Footer";
import { Clause, LegalCard, Sub, Term } from "@/components/legal";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How SydHustle Limited (RC 9677465) collects, uses, shares and protects personal data, in accordance with the Nigeria Data Protection Act 2023.",
  alternates: { canonical: "/privacy" },
};

/**
 * The Privacy Policy, as a numbered instrument beside the Terms.
 *
 * Drafted against the Nigeria Data Protection Act 2023 and written to
 * describe what the app ACTUALLY does, the NIN check through a
 * licensed verification provider, the coarse location that drives
 * distances, the first-party activity signals that rank the Skills
 * feed, and the deliberate walls between them (verification data never
 * feeds recommendations). A policy that flatters is a liability; one
 * that describes is a defence.
 */

const EFFECTIVE_DATE = "24 August 2026";

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 pb-24 pt-28 md:pt-32">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            Legal
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Effective date: {EFFECTIVE_DATE} · Version 1.0
          </p>

          <LegalCard>
            This Privacy Policy explains how{" "}
            <Term>SydHustle Limited</Term>, a private company limited by
            shares incorporated under the Companies and Allied Matters Act
            2020 with registration number <Term>RC 9677465</Term> (the{" "}
            <Term>&ldquo;Company&rdquo;</Term>,{" "}
            <Term>&ldquo;SydHustle&rdquo;</Term>, <Term>&ldquo;we&rdquo;</Term>
            , <Term>&ldquo;us&rdquo;</Term> or <Term>&ldquo;our&rdquo;</Term>),
            collects, uses, discloses and protects personal data in connection
            with the sydHustle mobile application and the website at
            sydhustle.com (together, the <Term>&ldquo;Platform&rdquo;</Term>).
            The Company is the data controller of that personal data within
            the meaning of the{" "}
            <Term>Nigeria Data Protection Act 2023</Term> (the{" "}
            <Term>&ldquo;NDPA&rdquo;</Term>). This Policy forms part of, and
            uses the defined terms of, our{" "}
            <a
              className="text-accent underline-offset-4 hover:underline"
              href="/legal/terms"
            >
              Terms &amp; Conditions
            </a>
            .
          </LegalCard>

          <Clause number="1" title="The Personal Data We Collect">
            <Sub n="1.1">
              <Term>Account and profile data.</Term> Your name, email address,
              phone number and password (stored only in hashed form); and the
              profile you choose to publish, display name, photograph, bio,
              the Skills you offer, and the ratings and reviews you receive.
              Your published profile is, by design, visible to other Users.
            </Sub>
            <Sub n="1.2">
              <Term>Location data.</Term> With your permission, your
              device&rsquo;s approximate location, used to measure how far
              away Hustles and Skills are and to show nearby opportunities.
              Precise addresses are never displayed to browsing Users: only
              neighbourhood-level labels and distances are shown, and the
              exact location of an engagement is disclosed to the other party
              only after payment is locked in Escrow. A coarse position
              (rounded to approximately one kilometre before it leaves your
              device) is recorded periodically so that nearby opportunities
              can reach you. You may decline or revoke location permission at
              any time in your device settings; the Platform remains fully
              usable, with distances simply omitted.
            </Sub>
            <Sub n="1.3">
              <Term>Identity verification data.</Term> To verify that accounts
              belong to real people before in-person work and withdrawals, we
              collect your National Identification Number (NIN) and obtain,
              through a duly licensed verification provider (currently
              Interswitch), the identity record registered against it,
              including name, date of birth, gender, registered address and
              phone number, and photograph. We retain an encrypted copy of
              that record, the provider&rsquo;s reference, and a record of
              which fields matched. This data is restricted to authorised
              staff, is never shown to other Users, and,{" "}
              <Term>
                deliberately, is never used to personalise, rank or recommend
                anything
              </Term>
              . Its sole purposes are verification, fraud and safety
              investigation, and response to valid legal process.
            </Sub>
            <Sub n="1.4">
              <Term>Preferences you volunteer.</Term> Any gender or interest
              information you choose to give us in the app is separate from
              the national record described in Clause 1.3 and is used only to
              improve what the Skills tab shows you while your account is new.
              It is never shown to other Users, never shared with advertisers,
              and can be changed or cleared in Settings at any time.
            </Sub>
            <Sub n="1.5">
              <Term>Transaction and Wallet data.</Term> Records of Hustles
              posted, Skills booked, amounts agreed, Escrow movements, Wallet
              balances, withdrawals and the bank account details you register
              for payouts. Card and account credentials used to fund your
              Wallet are processed by CBN-licensed payment providers
              (currently including OPay); we do not store your full card
              number.
            </Sub>
            <Sub n="1.6">
              <Term>Messages and content.</Term> The content of conversations
              conducted through in-app chat, and the content you post,
              Hustles, Skill listings, photographs, reviews and appeals.
              In-app conversations are the record on which disputes under the
              Terms are decided.
            </Sub>
            <Sub n="1.7">
              <Term>Emergency contact.</Term> If you register as a Hustler,
              the name and phone number of a trusted contact, used only in a
              safety emergency connected with an engagement and never shown to
              other Users.
            </Sub>
            <Sub n="1.8">
              <Term>Activity and device data.</Term> First-party signals about
              how you use the Platform, the listings you view, book, dismiss
              or report, and the notifications delivered to you, together
              with device type, operating system version, app version and
              crash diagnostics. Activity signals are processed on our own
              systems to rank the Skills feed and keep the marketplace fair;
              we do not embed third-party advertising or analytics trackers in
              the app.
            </Sub>
          </Clause>

          <Clause number="2" title="Why We Process It, and On What Legal Basis">
            <Sub n="2.1">
              Under section 25 of the NDPA, we process personal data on the
              following bases:
            </Sub>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                <Term>Performance of a contract</Term>, operating your
                account, matching Clients and Hustlers, messaging, payments,
                Escrow, release of funds and dispute handling under the Terms;
              </li>
              <li>
                <Term>Legal obligation</Term>, identity verification,
                financial record-keeping and reporting under Applicable Law,
                including the Money Laundering (Prevention and Prohibition)
                Act 2022;
              </li>
              <li>
                <Term>Legitimate interests</Term>, securing the Platform,
                preventing fraud, moderating content, ranking the feed from
                first-party activity, and improving the service, in each case
                balanced against your rights and freedoms; and
              </li>
              <li>
                <Term>Consent</Term>, location access, notification delivery,
                and the optional preferences in Clause 1.4. Consent may be
                withdrawn at any time without affecting the lawfulness of
                processing before withdrawal.
              </li>
            </ul>
            <Sub n="2.2">
              We do not sell personal data, we do not serve third-party
              advertising, and we do not use automated decision-making that
              produces legal or similarly significant effects about you
              without human review.
            </Sub>
          </Clause>

          <Clause number="3" title="How We Share Personal Data">
            <Sub n="3.1">Personal data is shared only:</Sub>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                <Term>with other Users</Term>, limited to what the marketplace
                requires, your published profile, ratings and reviews, your
                messages with a specific counterparty, and coarse
                location/distance as described in Clause 1.2;
              </li>
              <li>
                <Term>with payment providers</Term> licensed by the Central
                Bank of Nigeria, to fund Wallets, hold Escrow and settle
                withdrawals;
              </li>
              <li>
                <Term>with our verification provider</Term>, to perform the
                one-time identity check described in Clause 1.3;
              </li>
              <li>
                <Term>with an automated content-moderation provider</Term>,
                which analyses the content of messages and listings to detect
                prohibited material and returns only a classification of it.
                That provider is bound by a data-processing agreement, may use
                the content solely to perform the check, and may not use it to
                train its own models;
              </li>
              <li>
                <Term>with service providers</Term> engaged to operate the
                Platform, cloud hosting, database infrastructure, messaging
                and notification delivery, each bound by a data-processing
                agreement and permitted to use the data only for the engaged
                purpose; and
              </li>
              <li>
                <Term>with law enforcement or regulators</Term>, where
                required by valid legal process or where disclosure is
                necessary to protect a person from serious harm.
              </li>
            </ul>
            <Sub n="3.2">
              In the event of a merger, acquisition or reorganisation of the
              Company, personal data may be transferred to the successor
              entity on terms no less protective than this Policy, with notice
              to Users.
            </Sub>
          </Clause>

          <Clause number="4" title="International Transfers">
            <p>
              The Platform runs on cloud infrastructure whose servers may be
              located outside Nigeria. Where personal data is transferred
              outside Nigeria, the transfer is made in accordance with Part
              VIII of the NDPA, to jurisdictions providing an adequate level
              of protection, or otherwise under appropriate safeguards such as
              contractual clauses binding the recipient to protections
              equivalent to the NDPA.
            </p>
          </Clause>

          <Clause number="5" title="How Long We Keep It">
            <Sub n="5.1">
              Personal data is kept only as long as its purpose requires.
              Indicatively: account and profile data is deleted or anonymised
              within thirty (30) days of account deletion; content and
              moderation records are retained for at least twelve (12) months
              after resolution of any report or dispute.
            </Sub>
            <Sub n="5.2">
              Transaction records and identity-verification records are
              retained for at least five (5) years, notwithstanding account
              deletion, as required by financial record-keeping and
              anti-money-laundering obligations under Applicable Law. They
              remain encrypted and access-restricted for that period.
            </Sub>
          </Clause>

          <Clause number="6" title="Security">
            <p>
              We apply technical and organisational measures appropriate to
              the risk, including encryption of data in transit, encrypted
              storage of identity records, hashed password storage, tokenised
              payment handling, row-level access controls on our databases,
              and restriction of administrative access to authorised
              personnel. No system is perfectly secure; in the event of a
              breach likely to result in a risk to your rights, we will notify
              the Nigeria Data Protection Commission and affected Users as
              required by section 40 of the NDPA.
            </p>
          </Clause>

          <Clause number="7" title="Your Rights">
            <Sub n="7.1">
              Under Part VI of the NDPA you have the right to: access the
              personal data we hold about you and obtain a copy; correct
              inaccurate or incomplete data; request erasure, subject to the
              retention obligations in Clause 5; restrict or object to
              processing, including any processing based on legitimate
              interests; withdraw consent at any time; and data portability
              where processing is by automated means.
            </Sub>
            <Sub n="7.2">
              Most of these can be exercised directly in the app, editing
              your profile, clearing volunteered preferences, revoking
              location or notification permissions in device settings, and
              deleting your account (Settings &rarr; Delete Account). Anything
              else can be exercised through the channels in Clause 10; we
              respond within the time the NDPA allows.
            </Sub>
            <Sub n="7.3">
              If you are dissatisfied with our handling of your data, you have
              the right to lodge a complaint with the{" "}
              <Term>Nigeria Data Protection Commission</Term>.
            </Sub>
          </Clause>

          <Clause number="8" title="Children">
            <p>
              The Platform is for persons aged eighteen (18) and above. We do
              not knowingly collect personal data from anyone below that age,
              and if we learn that we have, we will delete it.
            </p>
          </Clause>

          <Clause number="9" title="Changes to This Policy">
            <p>
              We may update this Policy as the Platform changes. Material
              changes will be notified within the app or by email before they
              take effect, and the version and effective date at the head of
              this document will be updated. Continued use of the Platform
              after the effective date constitutes acceptance.
            </p>
          </Clause>

          <Clause number="10" title="Contacting Us About Your Data">
            <p>
              Questions, requests and complaints concerning personal data may
              be directed to:
            </p>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                Email:{" "}
                <a
                  className="text-accent underline-offset-4 hover:underline"
                  href="mailto:support@sydhustle.com"
                >
                  support@sydhustle.com
                </a>
              </li>
              <li>
                WhatsApp:{" "}
                <a
                  className="text-accent underline-offset-4 hover:underline"
                  href="https://wa.me/2347088569014"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  0708&nbsp;856&nbsp;9014
                </a>{" "}
                (@sydhustle)
              </li>
              <li>
                Instagram:{" "}
                <a
                  className="text-accent underline-offset-4 hover:underline"
                  href="https://instagram.com/sydhustleapp"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  @sydhustleapp
                </a>
              </li>
            </ul>
          </Clause>

          <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm leading-6 text-muted-foreground">
            <span className="font-semibold text-foreground">
              SydHustle Limited
            </span>{" "}
            · RC 9677465 · Incorporated in the Federal Republic of Nigeria
            under the Companies and Allied Matters Act 2020 · Data controller
            under the Nigeria Data Protection Act 2023.
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
