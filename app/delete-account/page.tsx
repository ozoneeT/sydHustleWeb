import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/Footer";
import { Clause, LegalCard, Sub, Term } from "@/components/legal";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Delete your account",
  description:
    "How to delete your sydHustle account and the personal data held against it, what deletion removes, and the records we are required to keep.",
  alternates: { canonical: "/delete-account" },
};

/**
 * The account-deletion route, required by Google Play's Data safety
 * section and by Apple 5.1.1(v).
 *
 * The point of this page is the second route, not the first. Play
 * requires a deletion path that works for someone who has ALREADY
 * uninstalled and cannot reach Settings any more, which is why the
 * email route is given equal weight to the in-app one — a page that
 * only says "open the app" does not satisfy the requirement.
 *
 * The retention table must not drift from DATA_RETENTION.md in the app
 * repo or from the Data safety answers in the Play Console: all three
 * are the same set of claims, and a reviewer who finds them disagreeing
 * reads it as under-disclosure.
 */

const EFFECTIVE_DATE = "3 September 2026";

export default function DeleteAccountPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 pb-24 pt-28 md:pt-32">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            Legal
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Delete your account
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Effective date: {EFFECTIVE_DATE} · Version 1.0
          </p>

          <LegalCard>
            You can ask <Term>SydHustle Limited</Term> (RC 9677465) to delete
            your sydHustle account and the personal data held against it at any
            time, for any reason, without giving one. There are two ways to do
            it, and the second does not require you to have the app installed.
          </LegalCard>

          <Clause number="1" title="If you still have the app">
            <Sub n="1.1">
              Open sydHustle and go to{" "}
              <Term>Profile → Danger zone → Delete account</Term>. The screen
              lists anything that has to be settled first, then asks you to
              confirm.
            </Sub>
            <Sub n="1.2">
              This is the fastest route, and it completes on its own — nobody at
              sydHustle reviews or approves it.
            </Sub>
          </Clause>

          <Clause number="2" title="If you no longer have the app">
            <Sub n="2.1">
              Email{" "}
              <a
                className="text-accent underline-offset-4 hover:underline"
                href="mailto:support@sydhustle.com?subject=Delete%20my%20account"
              >
                support@sydhustle.com
              </a>{" "}
              from the address registered on your account, with the subject{" "}
              <Term>&ldquo;Delete my account&rdquo;</Term>.
            </Sub>
            <Sub n="2.2">
              We will confirm that the request came from the account holder
              before acting on it, and we will confirm by email once it is done.
              We aim to acknowledge within <Term>7 days</Term> and to complete
              deletion within <Term>30 days</Term>.
            </Sub>
          </Clause>

          <Clause number="3" title="Before your account can be deleted">
            <Sub n="3.1">
              Deletion is blocked while you still owe something to someone else,
              because closing an account mid-transaction would strand the other
              person. Any of the following has to be settled first, and the app
              names whichever ones apply to you rather than refusing generically:
            </Sub>
            <Sub n="3.2">
              Hustles you posted that are still open or assigned; Skill bookings
              still open; funds held in escrow on either side of a Hustle;
              withdrawals or deposits still in flight; or a wallet balance that
              is not zero.
            </Sub>
          </Clause>

          <Clause number="4" title="What deletion removes">
            <Sub n="4.1">
              Within <Term>30 days</Term> of a confirmed request we delete or
              anonymise your account and profile data. That covers your profile
              and display name, photograph, bio and school; your Hustle listings
              and applications; your messages; the ratings and reviews you left;
              your emergency contacts; and your saved locations and preferences.
            </Sub>
          </Clause>

          <Clause number="5" title="What we are required to keep">
            <Sub n="5.1">
              We cannot delete everything, and we would rather say so plainly
              than imply a clean wipe. The following outlive your account:
            </Sub>
            <Sub n="5.2">
              <Term>Transaction and payment records</Term> — amounts, fees,
              payout records and invoices — are retained for the statutory
              financial record-keeping period. Where we can, your personal
              details are separated from the ledger; the ledger itself is kept.
            </Sub>
            <Sub n="5.3">
              <Term>Your identity verification record</Term> — your NIN, your BVN
              if you provided one, and the registered identity record returned by
              our verification provider, all held encrypted — is kept for up to{" "}
              <Term>7 years</Term>. It is retained to meet anti-money-laundering
              obligations on the wallet, and because it is the only record able
              to answer a later fraud claim, dispute, or lawful request from
              Nigerian law enforcement.
            </Sub>
            <Sub n="5.4">
              <Term>Moderation records</Term> — reports, blocks, and the outcome
              of any investigation — are kept for at least{" "}
              <Term>12 months</Term> after the matter is resolved, so that
              someone reported for harming another user cannot clear the record
              by deleting and registering again.
            </Sub>
            <Sub n="5.5">
              These retained records are restricted to authorised staff, are
              never shown to other users, and are purged once their retention
              period ends.
            </Sub>
          </Clause>

          <Clause number="6" title="Questions">
            <Sub n="6.1">
              Email{" "}
              <a
                className="text-accent underline-offset-4 hover:underline"
                href="mailto:support@sydhustle.com"
              >
                support@sydhustle.com
              </a>
              . Our{" "}
              <Link
                className="text-accent underline-offset-4 hover:underline"
                href="/privacy"
              >
                Privacy Policy
              </Link>{" "}
              sets out everything we collect and what we do with it.
            </Sub>
          </Clause>
        </div>
      </main>
      <Footer />
    </>
  );
}
