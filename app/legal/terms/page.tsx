import type { Metadata } from "next";

import { Footer } from "@/components/Footer";
import { Clause, LegalCard, Sub, Term } from "@/components/legal";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The Terms and Conditions governing use of the sydHustle platform, operated by SydHustle Limited (RC 9677465), a company incorporated in the Federal Republic of Nigeria.",
  alternates: { canonical: "/legal/terms" },
};

/**
 * The Terms & Conditions, as a numbered legal instrument.
 *
 * Drafted against Nigerian law, CAMA 2020, the FCCPA 2018, the NDPA
 * 2023, with jurisdiction in the High Court of Oyo State sitting in
 * Ibadan. The content lives in this file as JSX rather than markdown so
 * clause numbering, defined terms and cross-references render exactly
 * as written, which matters in a document where "Clause 14.3" has to
 * mean something.
 */

const EFFECTIVE_DATE = "13 August 2026";

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 pb-24 pt-28 md:pt-32">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            Legal
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Terms &amp; Conditions
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Effective date: {EFFECTIVE_DATE} · Version 1.0
          </p>

          <LegalCard>
            These Terms and Conditions constitute a legally binding agreement
            between you and <Term>SydHustle Limited</Term>, a private company
            limited by shares, incorporated under the Companies and Allied
            Matters Act 2020 with registration number{" "}
            <Term>RC 9677465</Term> (the <Term>&ldquo;Company&rdquo;</Term>,{" "}
            <Term>&ldquo;SydHustle&rdquo;</Term>,{" "}
            <Term>&ldquo;we&rdquo;</Term>, <Term>&ldquo;us&rdquo;</Term> or{" "}
            <Term>&ldquo;our&rdquo;</Term>). Please read them carefully before
            using the Platform. By creating an account, or by accessing or
            using the Platform in any manner, you accept these Terms and agree
            to be bound by them. If you do not agree, do not use the Platform.
          </LegalCard>

          <Clause number="1" title="Definitions and Interpretation">
            <Sub n="1.1">In these Terms, unless the context otherwise requires:</Sub>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                <Term>&ldquo;Platform&rdquo;</Term> means the sydHustle mobile
                application, the website at sydhustle.com, and every related
                service operated by the Company;
              </li>
              <li>
                <Term>&ldquo;User&rdquo;</Term> means any person who registers
                an account on, or otherwise accesses, the Platform, and{" "}
                <Term>&ldquo;you&rdquo;</Term> shall be construed accordingly;
              </li>
              <li>
                <Term>&ldquo;Hustler&rdquo;</Term> means a User who offers
                services on the Platform, whether by publishing a Skill or by
                applying to perform a Hustle;
              </li>
              <li>
                <Term>&ldquo;Provider&rdquo;</Term> means a User who posts a
                Hustle requesting that services be performed;
              </li>
              <li>
                <Term>&ldquo;Client&rdquo;</Term> means any User who procures
                services through the Platform, and includes a Provider who
                posts a Hustle and a User who books a Skill;
              </li>
              <li>
                <Term>&ldquo;Hustle&rdquo;</Term> means a request for services
                posted on the Platform by a Provider;
              </li>
              <li>
                <Term>&ldquo;Skill&rdquo;</Term> means a listing published by a
                Hustler describing services the Hustler offers, which a User
                may book;
              </li>
              <li>
                <Term>&ldquo;Service Contract&rdquo;</Term> means the contract
                for the performance of services formed directly between a
                Client and a Hustler pursuant to Clause 5;
              </li>
              <li>
                <Term>&ldquo;Wallet&rdquo;</Term> means the stored-value
                facility made available within the Platform pursuant to Clause
                6;
              </li>
              <li>
                <Term>&ldquo;Escrow&rdquo;</Term> means the arrangement
                described in Clause 6 by which a Client&rsquo;s payment is held
                pending completion of a Service Contract;
              </li>
              <li>
                <Term>&ldquo;Transaction Value&rdquo;</Term> means the amount
                agreed between a Client and a Hustler for the performance of a
                Service Contract, as recorded on the Platform; and
              </li>
              <li>
                <Term>&ldquo;Applicable Law&rdquo;</Term> means the laws of the
                Federal Republic of Nigeria, including without limitation the
                Companies and Allied Matters Act 2020, the Federal Competition
                and Consumer Protection Act 2018, the Nigeria Data Protection
                Act 2023, the Cybercrimes (Prohibition, Prevention, etc.) Act
                2015 (as amended), and the Money Laundering (Prevention and
                Prohibition) Act 2022.
              </li>
            </ul>
            <Sub n="1.2">
              Headings are for convenience only and do not affect
              interpretation. Words importing the singular include the plural
              and vice versa. References to a statute include that statute as
              amended, re-enacted or replaced.
            </Sub>
            <Sub n="1.3">
              These Terms are concluded electronically. You agree that your
              electronic acceptance, and records of it kept by the Company,
              satisfy any legal requirement that the agreement be in writing or
              signed, in accordance with the Evidence Act 2011 (as amended).
            </Sub>
          </Clause>

          <Clause number="2" title="What SydHustle Is, and What It Is Not">
            <Sub n="2.1">
              The Platform is an online marketplace that connects Clients who
              require services with Hustlers who offer them. Clients may post
              Hustles for Hustlers to apply to, or book a Hustler&rsquo;s
              published Skill directly. The Platform additionally provides
              in-app messaging, identity verification, payment processing,
              Escrow and dispute-resolution facilities in support of those
              connections.
            </Sub>
            <Sub n="2.2">
              <Term>The Company is an intermediary only.</Term> The Company is
              not a party to any Service Contract; does not itself perform, and
              does not supervise the performance of, any services; does not
              employ Hustlers; and does not guarantee the quality, safety,
              timeliness, legality or fitness for purpose of any services
              offered or performed through the Platform. Hustlers are
              independent contractors acting on their own account. Nothing in
              these Terms, and nothing done on the Platform, creates any
              employment, agency, partnership, joint venture or fiduciary
              relationship between the Company and any User.
            </Sub>
            <Sub n="2.3">
              The Company is not a bank and does not hold itself out as one.
              Payment, collection and settlement services connected with the
              Platform are provided through third-party payment service
              providers duly licensed by the Central Bank of Nigeria.
            </Sub>
          </Clause>

          <Clause number="3" title="Eligibility and Your Account">
            <Sub n="3.1">
              You may use the Platform only if you are at least eighteen (18)
              years of age and have the legal capacity to enter into a binding
              contract under Applicable Law.
            </Sub>
            <Sub n="3.2">
              You undertake to provide information that is true, accurate,
              current and complete when registering, and to keep it so. You are
              responsible for maintaining the confidentiality of your
              credentials and for all activity occurring under your account.
              You must notify the Company promptly through the channels in
              Clause 17 of any suspected unauthorised use.
            </Sub>
            <Sub n="3.3">
              One person may maintain only one account, which may act as both a
              Client and a Hustler. Accounts are personal and may not be sold,
              transferred or shared.
            </Sub>
          </Clause>

          <Clause number="4" title="Identity Verification">
            <Sub n="4.1">
              To protect Users, certain actions on the Platform, including
              offering a Skill, applying to a Hustle and booking a Hustler,
              require completion of identity verification. You consent to the
              Company verifying, through duly licensed verification providers,
              government-issued identification and such other information as
              may reasonably be required, in accordance with the Nigeria Data
              Protection Act 2023 and the Company&rsquo;s Privacy Policy.
            </Sub>
            <Sub n="4.2">
              A verification badge signifies only that a government-issued
              identity document was checked against the name on the account at
              the time of verification. It is not an endorsement, guarantee or
              warranty by the Company of any User&rsquo;s skill, honesty or
              conduct.
            </Sub>
          </Clause>

          <Clause number="5" title="Booking and Formation of the Service Contract">
            <Sub n="5.1">
              <Term>Booking a Skill.</Term> A User may book a published Skill.
              The booking opens a conversation between the Client and the
              Hustler in which the scope of work, schedule and price are agreed.
            </Sub>
            <Sub n="5.2">
              <Term>Applying to a Hustle.</Term> A Hustler may apply to a
              posted Hustle. The application opens a conversation in which the
              parties may negotiate the price and particulars. The price stated
              on a Hustle is the Provider&rsquo;s asking price and may be
              varied by agreement in the conversation before payment is made.
            </Sub>
            <Sub n="5.3">
              A Service Contract is formed directly between the Client and the
              Hustler when the Client commits payment of the agreed Transaction
              Value into Escrow. The Service Contract is between those two
              Users alone; the Company&rsquo;s role is limited to that
              described in Clause 2.
            </Sub>
            <Sub n="5.4">
              Precise addresses are withheld from browsing surfaces by design.
              A Hustler receives the exact location of an in-person engagement,
              and directions to it, only after payment has been locked in
              Escrow.
            </Sub>
          </Clause>

          <Clause number="6" title="Payments, Wallet and Escrow">
            <Sub n="6.1">
              Payments on the Platform are made from the Client&rsquo;s Wallet,
              which may be funded by bank transfer, card or such other methods
              as the Platform supports from time to time, processed by
              CBN-licensed payment service providers.
            </Sub>
            <Sub n="6.2">
              <Term>Escrow.</Term> When a Client commits payment for a Service
              Contract, the Transaction Value is debited from the
              Client&rsquo;s Wallet and held in Escrow. Funds held in Escrow
              are not available to either party and are released only in
              accordance with Clause 7, Clause 9 or Clause 10.
            </Sub>
            <Sub n="6.3">
              Wallet balances are stored value, not deposits. They do not earn
              interest, are not insured by the Nigeria Deposit Insurance
              Corporation, and are held with the Company&rsquo;s licensed
              payment partners for the purpose of settling transactions on the
              Platform. You may withdraw your available Wallet balance to your
              verified bank account at any time, subject to Clause 8 and to
              anti-fraud checks.
            </Sub>
            <Sub n="6.4">
              <Term>Off-platform payment is prohibited</Term> for any
              engagement arranged through the Platform. Taking payment outside
              the Platform deprives both parties of Escrow protection and the
              dispute process, and is a material breach of these Terms that may
              result in suspension or termination under Clause 14.
            </Sub>
          </Clause>

          <Clause number="7" title="Release of Payment to the Hustler">
            <Sub n="7.1">
              Funds held in Escrow are released to the Hustler&rsquo;s Wallet,
              less the fees in Clause 8, upon the earlier of: (a) the
              Client&rsquo;s confirmation within the Platform that the services
              have been completed; or (b) the determination of a dispute in the
              Hustler&rsquo;s favour under Clause 10.
            </Sub>
            <Sub n="7.2">
              Where a Client fails to either confirm completion or raise a
              dispute within a reasonable period after the Hustler marks the
              work complete, the Company may, after notice to the Client,
              release the funds to the Hustler. This prevents payment being
              withheld indefinitely by inaction.
            </Sub>
            <Sub n="7.3">
              Release of funds is an administrative act performed by the
              Company as intermediary. It is not an adjudication of, and does
              not extinguish, any claim either party may have against the other
              under the Service Contract.
            </Sub>
          </Clause>

          <Clause number="8" title="Fees">
            <Sub n="8.1">
              <Term>Service Fee.</Term> On the completion of a Service
              Contract, the Company charges a service fee of ten per cent
              (10%) of the Transaction Value, deducted from the amount released
              to the Hustler.
            </Sub>
            <Sub n="8.2">
              <Term>Escrow Administration Fee.</Term> Where a Service Contract
              is cancelled or the Transaction Value is refunded after funds
              have been locked in Escrow, the Company charges an escrow
              administration fee of five per cent (5%) of the Transaction
              Value, reflecting the cost of payment processing, holding and
              administration.
            </Sub>
            <Sub n="8.3">
              Fees are dynamic and may vary by category, promotion or feature.
              The fee applicable to a transaction is disclosed within the
              Platform before you commit payment, and the fee so disclosed
              prevails over the indicative rates in Clauses 8.1 and 8.2 for
              that transaction. The Company may revise its standard fees from
              time to time by notice within the Platform; revised fees apply
              only to transactions entered into after the notice.
            </Sub>
            <Sub n="8.4">
              Optional paid features, including promotional placement
              (&ldquo;boosts&rdquo;) and SMS notification subscriptions, are
              charged at the prices displayed at the point of purchase.
              Purchases made through the Apple App Store or Google Play are
              additionally subject to the refund policies of those stores.
            </Sub>
            <Sub n="8.5">
              All fees are stated inclusive of applicable taxes unless
              otherwise indicated. Each User remains responsible for their own
              tax obligations arising from amounts earned through the Platform.
            </Sub>
          </Clause>

          <Clause number="9" title="Cancellations and Refunds">
            <Sub n="9.1">
              Before payment is committed to Escrow, either party may withdraw
              from a proposed engagement without charge.
            </Sub>
            <Sub n="9.2">
              After payment is committed but before performance has commenced,
              the Client may cancel, in which case the Transaction Value is
              returned to the Client&rsquo;s Wallet less the escrow
              administration fee in Clause 8.2.
            </Sub>
            <Sub n="9.3">
              Where the Hustler fails to perform, or the parties agree to
              cancel, the Transaction Value is refunded to the Client&rsquo;s
              Wallet. The Company may waive the escrow administration fee where
              the cancellation is attributable to the Hustler&rsquo;s default.
            </Sub>
            <Sub n="9.4">
              Where performance has commenced, cancellation and any
              apportionment of the Transaction Value are resolved by agreement
              between the parties or, failing agreement, under Clause 10.
            </Sub>
            <Sub n="9.5">
              Nothing in this Clause limits any right to a refund or redress
              that a consumer enjoys under the Federal Competition and Consumer
              Protection Act 2018, which rights are not excluded or restricted
              by these Terms.
            </Sub>
          </Clause>

          <Clause number="10" title="Disputes Between Users">
            <Sub n="10.1">
              A party to a Service Contract who contends that the other has not
              performed, or has not performed properly, may raise a dispute
              within the Platform. While a dispute is open, the funds in
              Escrow remain locked.
            </Sub>
            <Sub n="10.2">
              The Company will review the dispute on the materials available to
              it, including the in-app conversation, the terms recorded on
              the Platform and any evidence the parties submit, and will
              determine, acting reasonably and in good faith, whether the funds
              in Escrow should be released to the Hustler, refunded to the
              Client, or apportioned. Each party will be given the opportunity
              to be heard, and an appeal channel is provided within the
              Platform.
            </Sub>
            <Sub n="10.3">
              The Company&rsquo;s determination is an administrative resolution
              of the destination of the escrowed funds only. It does not bar
              either party from pursuing any claim against the other before a
              court of competent jurisdiction, and the Company makes no
              determination of legal liability between the parties.
            </Sub>
            <Sub n="10.4">
              Because in-app conversations are the record on which disputes are
              decided, Users are advised to keep all negotiation and agreement
              concerning an engagement within the Platform.
            </Sub>
          </Clause>

          <Clause number="11" title="Obligations of Hustlers">
            <p>Every Hustler undertakes to:</p>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                describe their Skills, qualifications, experience and prices
                truthfully, and hold any licence or certification that
                Applicable Law requires for the services they offer;
              </li>
              <li>
                perform each Service Contract with reasonable skill, care and
                diligence, in accordance with what was agreed with the Client;
              </li>
              <li>
                attend engagements punctually, or communicate promptly where
                that becomes impossible;
              </li>
              <li>
                comply with Applicable Law in the performance of all services,
                including health, safety and licensing requirements;
              </li>
              <li>
                keep all negotiation, agreement and payment within the
                Platform; and
              </li>
              <li>
                account for their own taxes on amounts earned through the
                Platform.
              </li>
            </ul>
          </Clause>

          <Clause number="12" title="Obligations of Clients">
            <p>Every Client undertakes to:</p>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                describe the work required honestly and lawfully when posting a
                Hustle or booking a Skill;
              </li>
              <li>
                not request services that are illegal, unsafe, or that would
                require the Hustler to breach Applicable Law;
              </li>
              <li>
                provide a safe environment and reasonable cooperation for
                in-person engagements;
              </li>
              <li>
                pay through the Platform, and confirm completion promptly and
                honestly when the services have been performed; and
              </li>
              <li>
                raise any dissatisfaction through the dispute process in Clause
                10 rather than by withholding confirmation.
              </li>
            </ul>
          </Clause>

          <Clause number="13" title="Prohibited Activities">
            <Sub n="13.1">You must not, in connection with the Platform:</Sub>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                post, request or perform services that are unlawful, dangerous
                or fraudulent, or that infringe the rights of any person;
              </li>
              <li>
                circumvent the Platform&rsquo;s fees or Escrow by soliciting or
                taking payment outside the Platform for an engagement arranged
                through it;
              </li>
              <li>
                impersonate any person, misrepresent your identity or
                credentials, or verify an account with documents that are not
                your own;
              </li>
              <li>
                harass, threaten, defame, exploit or discriminate against any
                User, or use the Platform to locate a person for any purpose
                unconnected with a lawful engagement;
              </li>
              <li>
                publish false, incentivised or retaliatory reviews, or
                manipulate ratings, impressions or placement;
              </li>
              <li>
                use the Platform for money laundering, terrorism financing or
                any purpose contrary to the Money Laundering (Prevention and
                Prohibition) Act 2022;
              </li>
              <li>
                introduce malicious code, scrape, reverse-engineer or
                interfere with the Platform, or access it by automated means
                without the Company&rsquo;s written consent, contrary to the
                Cybercrimes (Prohibition, Prevention, etc.) Act 2015 (as
                amended); or
              </li>
              <li>
                assist, encourage or permit any other person to do any of the
                foregoing.
              </li>
            </ul>
          </Clause>

          <Clause number="14" title="Suspension and Termination">
            <Sub n="14.1">
              You may close your account at any time within the app (Settings
              &rarr; Delete Account). Closure does not affect accrued rights
              and obligations, including any pending Service Contract, dispute
              or fee.
            </Sub>
            <Sub n="14.2">
              The Company may suspend or restrict an account, remove content,
              or terminate an account, where it reasonably believes that the
              User has breached these Terms, the Community Guidelines or
              Applicable Law, or where suspension is necessary to protect other
              Users, the Company or the integrity of the Platform. Save where
              immediate action is reasonably required, the Company will give
              notice and an opportunity to respond, and an appeal channel is
              provided.
            </Sub>
            <Sub n="14.3">
              On termination, funds properly standing to your credit in your
              Wallet, and not the subject of an open dispute, investigation or
              chargeback, will be remitted to your verified bank account.
            </Sub>
            <Sub n="14.4">
              Clauses which by their nature should survive termination,
              including Clauses 8, 10, 15, 16 and 18, survive it.
            </Sub>
          </Clause>

          <Clause number="15" title="Intellectual Property and User Content">
            <Sub n="15.1">
              The Platform, its software, design, trade marks, logos and
              branding are the property of the Company or its licensors. No
              right or licence in them is granted to you save the limited,
              personal, non-transferable right to use the Platform in
              accordance with these Terms.
            </Sub>
            <Sub n="15.2">
              You retain ownership of content you post. You grant the Company a
              non-exclusive, royalty-free, worldwide licence to host,
              reproduce, display and distribute that content solely for the
              operation, improvement and promotion of the Platform. You warrant
              that you hold all rights necessary in any content you post.
            </Sub>
            <Sub n="15.3">
              Ratings and reviews must reflect a genuine transaction
              experience. The Company may remove content that breaches these
              Terms and, where a review is disputed, will handle it through the
              review-appeal process provided in the Platform.
            </Sub>
          </Clause>

          <Clause number="16" title="Disclaimers and Limitation of Liability">
            <Sub n="16.1">
              The Platform is provided on an &ldquo;as is&rdquo; and &ldquo;as
              available&rdquo; basis. To the fullest extent permitted by
              Applicable Law, the Company disclaims all warranties, express or
              implied, concerning the Platform and concerning the conduct,
              services or content of any User.
            </Sub>
            <Sub n="16.2">
              The Company is not liable for the acts or omissions of any User,
              for the performance or non-performance of any Service Contract,
              or for any loss, damage or injury arising out of an engagement
              between Users, save to the extent such loss is caused by the
              Company&rsquo;s own negligence or wilful default.
            </Sub>
            <Sub n="16.3">
              To the fullest extent permitted by Applicable Law, the Company is
              not liable for any indirect, incidental, special or consequential
              loss, or for loss of profits, revenue, goodwill or data, and the
              Company&rsquo;s aggregate liability to any User arising out of or
              in connection with these Terms or the Platform shall not exceed
              the total fees paid by that User to the Company in the twelve
              (12) months preceding the event giving rise to the claim.
            </Sub>
            <Sub n="16.4">
              Nothing in these Terms excludes or limits liability for death or
              personal injury caused by negligence, for fraud or fraudulent
              misrepresentation, or for any liability which cannot be excluded
              or limited under Applicable Law, including rights conferred on
              consumers by the Federal Competition and Consumer Protection Act
              2018.
            </Sub>
            <Sub n="16.5">
              You will indemnify and hold the Company harmless against claims,
              losses and expenses (including reasonable legal fees) arising
              from your breach of these Terms, your content, or your
              performance of, or conduct in connection with, any Service
              Contract, save to the extent caused by the Company&rsquo;s own
              default.
            </Sub>
          </Clause>

          <Clause number="17" title="Privacy and Data Protection">
            <Sub n="17.1">
              The Company processes personal data as a data controller in
              accordance with the Nigeria Data Protection Act 2023 and its{" "}
              <a
                className="text-accent underline-offset-4 hover:underline"
                href="/privacy"
              >
                Privacy Policy
              </a>
              , which forms part of these Terms by reference. This includes data supplied at
              registration, identity-verification data processed through
              licensed providers, approximate location used to show nearby
              opportunities and distances, and records of transactions and
              communications on the Platform.
            </Sub>
            <Sub n="17.2">
              Identity documents are used for verification only. Data collected
              for verification is not used to profile Users or to drive
              recommendations. Precise addresses are never displayed to
              browsing Users; only coarse, neighbourhood-level locations and
              distances are shown.
            </Sub>
            <Sub n="17.3">
              You have the rights conferred by the Nigeria Data Protection Act
              2023, including rights of access, rectification and erasure,
              exercisable through the contact channels in Clause 19 or the
              controls within the app.
            </Sub>
          </Clause>

          <Clause number="18" title="Governing Law and Jurisdiction">
            <Sub n="18.1">
              These Terms, and any dispute or claim (whether contractual or
              non-contractual) arising out of or in connection with them or
              the Platform, are governed by and construed in accordance with
              the laws of the Federal Republic of Nigeria.
            </Sub>
            <Sub n="18.2">
              The parties shall first attempt in good faith to resolve any
              dispute with the Company amicably through the contact channels in
              Clause 19. Where a dispute is not resolved within thirty (30)
              days, the parties may by agreement refer it to mediation in
              accordance with the Arbitration and Mediation Act 2023.
            </Sub>
            <Sub n="18.3">
              Subject to Clause 18.2, the parties irrevocably submit to the
              exclusive jurisdiction of the{" "}
              <Term>High Court of Oyo State sitting in Ibadan</Term> for the
              determination of any dispute arising out of or in connection with
              these Terms or the Platform.
            </Sub>
            <Sub n="18.4">
              Nothing in this Clause deprives a consumer of the right to lodge
              a complaint with the Federal Competition and Consumer Protection
              Commission, or of any other non-excludable right or forum
              conferred by Applicable Law.
            </Sub>
          </Clause>

          <Clause number="19" title="Contacting SydHustle">
            <p>Support and notices to the Company may be directed to:</p>
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
            <p>
              The Company may give notices to Users by in-app notice, push
              notification or email to the address on the account, and such
              notice is deemed received when sent.
            </p>
          </Clause>

          <Clause number="20" title="General">
            <Sub n="20.1">
              <Term>Variation.</Term> The Company may amend these Terms from
              time to time. Material changes will be notified within the
              Platform at least seven (7) days before they take effect, and
              continued use of the Platform after the effective date
              constitutes acceptance. The version and effective date appear at
              the head of this document.
            </Sub>
            <Sub n="20.2">
              <Term>Severance.</Term> If any provision of these Terms is held
              invalid or unenforceable, it shall be severed and the remainder
              shall continue in full force.
            </Sub>
            <Sub n="20.3">
              <Term>No waiver.</Term> A failure or delay by the Company in
              exercising any right is not a waiver of it.
            </Sub>
            <Sub n="20.4">
              <Term>Assignment.</Term> You may not assign your rights or
              obligations under these Terms. The Company may assign or novate
              these Terms to an affiliate or to a successor in the course of a
              merger, acquisition or reorganisation, with notice to Users.
            </Sub>
            <Sub n="20.5">
              <Term>Force majeure.</Term> The Company is not liable for any
              failure or delay caused by events beyond its reasonable control,
              including acts of God, civil unrest, failures of
              telecommunications or payment infrastructure, or acts of
              government.
            </Sub>
            <Sub n="20.6">
              <Term>Entire agreement.</Term> These Terms, together with the{" "}
              <a
                className="text-accent underline-offset-4 hover:underline"
                href="/privacy"
              >
                Privacy Policy
              </a>{" "}
              and the{" "}
              <a
                className="text-accent underline-offset-4 hover:underline"
                href="/policies_center/community_standard"
              >
                Community Standards
              </a>
              , constitute the
              entire agreement between you and the Company concerning the
              Platform and supersede all prior understandings on that subject.
            </Sub>
          </Clause>

          <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm leading-6 text-muted-foreground">
            <span className="font-semibold text-foreground">
              SydHustle Limited
            </span>{" "}
            · RC 9677465 · Incorporated in the Federal Republic of Nigeria
            under the Companies and Allied Matters Act 2020.
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
