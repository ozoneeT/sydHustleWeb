import Link from "next/link";
import { notFound } from "next/navigation";

import { PrintButton } from "@/components/console/PrintButton";
import { Card } from "@/components/ui/card";
import { naira, shortDate } from "@/lib/console/format";
import { getTransactionDetail, REASON_LABELS } from "@/lib/console/transactions";

export const metadata = { title: "Transaction — sydHustle Console" };
export const dynamic = "force-dynamic";

/**
 * Level three: one movement, and everything the platform knows about it.
 *
 * Written for the request it exists to answer — a bank or the police
 * naming one transfer — which drives three rules the ordinary console
 * pages do not follow:
 *
 *  1. **A field that was never captured says so.** Null renders as "not
 *     recorded", never as blank and never omitted. On an evidentiary
 *     record the difference between "zero" and "we never had it" is the
 *     whole answer, and a hidden row reads as the former.
 *  2. **Nothing is rounded away.** Amounts, references, ids and
 *     timestamps appear as stored. The identifiers are monospaced
 *     because they get copied into somebody else's system.
 *  3. **It prints.** A record that cannot leave the screen is not much
 *     use in an enquiry.
 */

function Fact({
  label,
  value,
  mono,
}: {
  label: string;
  value: unknown;
  mono?: boolean;
}) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className="flex flex-wrap justify-between gap-4 border-b border-white/5 py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`text-sm ${mono ? "font-mono text-xs" : ""} ${
          empty ? "italic text-muted-foreground/60" : ""
        }`}
      >
        {empty ? "not recorded" : String(value)}
      </span>
    </div>
  );
}

function Section({
  title,
  blurb,
  children,
}: {
  title: string;
  blurb?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      {blurb ? (
        <p className="mt-1 text-xs text-muted-foreground">{blurb}</p>
      ) : null}
      <div className="mt-3">{children}</div>
    </Card>
  );
}

const money = (value: unknown) =>
  value === null || value === undefined ? null : naira(Number(value));

const when = (value: unknown) =>
  value === null || value === undefined ? null : shortDate(String(value));

const coords = (record: Record<string, unknown> | null | undefined) => {
  if (!record) return null;
  const lat = record.latitude;
  const lng = record.longitude;
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return null;
  }
  return `${lat}, ${lng}`;
};

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ profileId: string; reference: string }>;
}) {
  const { profileId, reference } = await params;
  const detail = await getTransactionDetail(reference);
  if (!detail) notFound();

  const entry = detail.entry as Record<string, unknown>;
  const account = (detail.account ?? {}) as Record<string, unknown>;
  const deposit = (detail.deposit ?? null) as Record<string, unknown> | null;
  const withdrawal = (detail.withdrawal ?? null) as Record<string, unknown> | null;
  const escrow = (detail.escrow ?? null) as Record<string, unknown> | null;
  const location = (detail.location ?? null) as Record<string, unknown> | null;
  const refund = (detail.refund ?? null) as Record<string, unknown> | null;

  const intent = (deposit?.intent ?? null) as Record<string, unknown> | null;
  const virtualAccount = (deposit?.virtual_account ?? null) as Record<
    string,
    unknown
  > | null;
  const origin = (deposit?.origin ?? null) as Record<string, unknown> | null;
  const depositReview = (deposit?.review ?? null) as Record<
    string,
    unknown
  > | null;

  const hustle = (escrow?.hustle ?? null) as Record<string, unknown> | null;
  const booking = (escrow?.booking ?? null) as Record<string, unknown> | null;
  const payer = (escrow?.payer ?? null) as Record<string, unknown> | null;
  const payee = (escrow?.payee ?? null) as Record<string, unknown> | null;

  const credit = entry.direction === "credit";

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="print:hidden">
        <Link
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          href={`/console/transactions/${profileId}`}
        >
          ← {String(account.display_name ?? "this user")}&apos;s ledger
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {REASON_LABELS[String(entry.reason)] ?? String(entry.reason)}
          </h1>
          <p className="font-mono text-sm text-muted-foreground">
            {String(entry.reference)}
          </p>
        </div>
        <div className="text-right">
          <p
            className={`text-3xl font-bold ${credit ? "text-emerald-400" : "text-red-400"}`}
          >
            {credit ? "+" : "−"}
            {naira(Number(entry.amount))}
          </p>
          <p className="text-xs text-muted-foreground">
            {shortDate(String(entry.created_at))}
          </p>
        </div>
      </div>

      <div className="print:hidden">
        <PrintButton />
      </div>

      <Section
        blurb="Taken from the ledger's own committed figures, not recomputed. The ledger is append-only: these lines were written inside the same transaction as the movement they describe."
        title="The movement"
      >
        <Fact label="Direction" value={credit ? "Money in" : "Money out"} />
        <Fact label="Amount" value={money(entry.amount)} />
        <Fact label="Balance before" value={money(entry.balance_before)} />
        <Fact label="Balance after" value={money(entry.balance_after)} />
        <Fact label="Recorded at" value={when(entry.created_at)} />
        <Fact label="sydHustle reference" mono value={entry.reference} />
        <Fact label="Provider reference" mono value={entry.provider_reference} />
        <Fact
          label="NIP session ID"
          mono
          value={entry.settlement_id}
        />
        <Fact label="Idempotency key" mono value={entry.idem_key} />
        <Fact label="Ledger entry ID" mono value={entry.id} />
        <Fact label="Note" value={entry.note} />
      </Section>

      <Section
        blurb="The wallet this entry belongs to, and the identity checks standing behind it at the time of reading."
        title="The account"
      >
        <Fact label="Name" value={account.display_name} />
        <Fact label="Email" value={account.email} />
        <Fact label="Profile ID" mono value={account.profile_id} />
        <Fact label="Wallet ID" mono value={account.wallet_id} />
        <Fact label="Joined" value={when(account.joined_at)} />
        <Fact
          label="NIN verified"
          value={account.identity_verified ? "Yes" : "No"}
        />
        <Fact label="BVN verified" value={account.bvn_verified ? "Yes" : "No"} />
        <Fact label="Balance now" value={money(account.balance_now)} />
        <Fact label="Held for review now" value={money(account.restricted_now)} />
      </Section>

      {origin ? (
        <Section
          blurb="The sending side, as the payment provider reported it. Parsed from their notification, which is kept verbatim below — the parsed fields are an interpretation, the payload is the evidence."
          title="Where the money came from"
        >
          <Fact label="Sender name" value={origin.sender_name} />
          <Fact label="Sender account" mono value={origin.sender_account} />
          <Fact label="Sender bank" value={origin.sender_bank} />
          <Fact label="Narration" value={origin.narration} />
          <Fact label="Reported by" value={origin.provider} />
          <Fact label="Captured at" value={when(origin.captured_at)} />
          {origin.raw_payload ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-muted-foreground">
                Provider notification, verbatim
              </summary>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-black/30 p-3 text-[11px] leading-relaxed">
                {JSON.stringify(origin.raw_payload, null, 2)}
              </pre>
            </details>
          ) : null}
        </Section>
      ) : null}

      {deposit && !origin ? (
        <Section
          blurb="This credit predates sender capture, or arrived through a channel that carries no sending account."
          title="Where the money came from"
        >
          <Fact label="Sender name" value={null} />
          <Fact label="Sender account" value={null} />
          <Fact label="Sender bank" value={null} />
        </Section>
      ) : null}

      {virtualAccount ? (
        <Section
          blurb="The account the transfer landed in. Permanent, issued to this user, and in their own name."
          title="The receiving account"
        >
          <Fact label="Bank" value={virtualAccount.bank_name} />
          <Fact label="Account number" mono value={virtualAccount.account_number} />
          <Fact label="Account name" value={virtualAccount.account_name} />
          <Fact label="Provider" value={virtualAccount.provider} />
          <Fact label="Bank code" mono value={virtualAccount.bank_code} />
          <Fact
            label="Tracking reference"
            mono
            value={virtualAccount.tracking_reference}
          />
          <Fact label="Issued at" value={when(virtualAccount.created_at)} />
        </Section>
      ) : null}

      {intent ? (
        <Section
          blurb="A hosted checkout: the user started this deposit in the app and the provider confirmed it."
          title="The payment intent"
        >
          <Fact label="Our reference" mono value={intent.reference} />
          <Fact label="Provider" value={intent.provider} />
          <Fact label="Provider reference" mono value={intent.provider_reference} />
          <Fact label="NIP session ID" mono value={intent.session_id} />
          <Fact label="Amount" value={money(intent.amount)} />
          <Fact label="Status" value={intent.status} />
          <Fact label="Started at" value={when(intent.created_at)} />
          <Fact label="Settled at" value={when(intent.settled_at)} />
        </Section>
      ) : null}

      {withdrawal ? (
        <Section
          blurb="Money leaving to a bank. The destination must be in the account holder's own name, matched against the NIN on file — that check and its date are on the record below."
          title="Where the money went"
        >
          <Fact label="Status" value={withdrawal.status} />
          <Fact label="Amount requested" value={money(withdrawal.gross)} />
          <Fact label="sydHustle fee" value={money(withdrawal.fee)} />
          <Fact
            label="Stamp duty (government)"
            value={money(withdrawal.stamp_duty)}
          />
          <Fact label="Net sent to bank" value={money(withdrawal.net_sent)} />
          <Fact label="Bank" value={withdrawal.bank_name} />
          <Fact label="Bank code" mono value={withdrawal.bank_code} />
          <Fact label="Account number" mono value={withdrawal.account_number} />
          <Fact label="Account name" value={withdrawal.account_name} />
          <Fact
            label="Name matched against NIN"
            value={when(withdrawal.name_checked_at)}
          />
          <Fact label="Provider" value={withdrawal.provider} />
          <Fact
            label="Provider reference"
            mono
            value={withdrawal.provider_reference}
          />
          <Fact label="NIP session ID" mono value={withdrawal.session_id} />
          <Fact label="Recipient code" mono value={withdrawal.recipient_code} />
          <Fact
            label="Authorised by"
            value={
              withdrawal.auth_proof === "biometric"
                ? "Fingerprint or Face ID"
                : withdrawal.auth_proof === "device_credential"
                  ? "Device passcode"
                  : withdrawal.auth_proof === "pin"
                    ? "Wallet PIN"
                    : withdrawal.auth_proof
            }
          />
          <Fact
            label="Automatic sweep"
            value={withdrawal.automatic ? "Yes" : "No"}
          />
          <Fact label="Failure reason" value={withdrawal.failure_reason} />
          <Fact label="Requested at" value={when(withdrawal.requested_at)} />
          <Fact label="Last updated" value={when(withdrawal.updated_at)} />
          <Fact label="Withdrawal ID" mono value={withdrawal.id} />
        </Section>
      ) : null}

      {escrow ? (
        <Section
          blurb="Money held between two people while work happened. Both sides are identified by profile id as well as name — a name can change, an id cannot."
          title="The work this paid for"
        >
          <Fact label="Escrow status" value={escrow.status} />
          <Fact label="Amount held" value={money(escrow.amount)} />
          <Fact label="sydHustle fee" value={money(escrow.platform_fee)} />
          <Fact label="Net to the Hustler" value={money(escrow.net_to_hustler)} />
          <Fact label="Held at" value={when(escrow.held_at)} />
          <Fact label="Settled at" value={when(escrow.settled_at)} />
          <Fact label="Escrow ID" mono value={escrow.id} />

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Paid by (Provider)
              </p>
              <Fact label="Name" value={payer?.display_name} />
              <Fact label="Email" value={payer?.email} />
              <Fact label="Profile ID" mono value={payer?.id} />
            </div>
            <div className="rounded-lg border border-white/10 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Paid to (Hustler)
              </p>
              <Fact label="Name" value={payee?.display_name} />
              <Fact label="Email" value={payee?.email} />
              <Fact label="Profile ID" mono value={payee?.id} />
            </div>
          </div>
        </Section>
      ) : null}

      {hustle ? (
        <Section
          blurb="The Hustle as it was posted, including where it was advertised to happen."
          title="The Hustle"
        >
          <Fact label="Title" value={hustle.title} />
          <Fact label="Description" value={hustle.description} />
          <Fact label="Category" value={hustle.category} />
          <Fact label="Agreed price" value={money(hustle.price)} />
          <Fact label="Status" value={hustle.status} />
          <Fact label="Scheduled for" value={when(hustle.scheduled_for)} />
          <Fact label="Stated location" value={hustle.location_text} />
          <Fact label="Location detail" value={hustle.location_detail} />
          <Fact label="Stated coordinates" mono value={coords(hustle)} />
          <Fact label="Posted at" value={when(hustle.posted_at)} />
          <Fact label="Hustle ID" mono value={hustle.hustle_id} />
          <Fact label="Application ID" mono value={hustle.application_id} />
          <Fact label="Provider profile ID" mono value={hustle.provider_id} />
          <Fact
            label="Assigned Hustler profile ID"
            mono
            value={hustle.assigned_hustler_id}
          />
        </Section>
      ) : null}

      {booking ? (
        <Section
          blurb="A Skill booking rather than a posted Hustle: the client approached the Hustler's listing."
          title="The booking"
        >
          <Fact label="Skill" value={booking.skill_name} />
          <Fact label="Listed as" value={booking.display_name} />
          <Fact label="Category" value={booking.category_id} />
          <Fact label="Status" value={booking.status} />
          <Fact label="Booked at" value={when(booking.booked_at)} />
          <Fact label="Booking ID" mono value={booking.booking_id} />
          <Fact label="Skill ID" mono value={booking.skill_id} />
          <Fact label="Client profile ID" mono value={booking.client_id} />
          <Fact label="Hustler profile ID" mono value={booking.provider_id} />
        </Section>
      ) : null}

      {location ? (
        <Section
          blurb="Where the phones actually were when this money moved — captured at release and readable by nobody outside this desk, not even by the person the points belong to. It is the only record that can answer whether anyone was actually there."
          title="Where it happened"
        >
          <Fact label="Coordinates" mono value={coords(location)} />
          <Fact label="Nearest known place" value={location.label} />
          <Fact label="Captured at" value={when(location.captured_at)} />
        </Section>
      ) : null}

      {depositReview || refund ? (
        <Section
          blurb="This money was held for review. A held deposit cannot be withdrawn, spent on a Hustle, or moved at all until it is cleared or sent back."
          title="Review and refund"
        >
          <Fact
            label="Review status"
            value={(depositReview ?? refund)?.status}
          />
          <Fact
            label="Why it was held"
            value={
              (depositReview ?? refund)?.origin === "manual"
                ? "Held by an operator"
                : (depositReview ?? refund)?.origin === "threshold"
                  ? `Above the tier threshold of ${money((depositReview ?? refund)?.threshold) ?? "—"}`
                  : null
            }
          />
          <Fact label="Operator's reason" value={(depositReview ?? refund)?.note} />
          <Fact
            label="Told the user"
            value={(depositReview ?? refund)?.resolution}
          />
          <Fact label="Held by" value={refund?.flagged_by} />
          <Fact label="Decided by" value={(depositReview ?? refund)?.decided_by} />
          <Fact
            label="Refund requested at"
            value={when(refund?.refund_requested_at)}
          />
          <Fact
            label="Provider refund reference"
            mono
            value={refund?.refund_reference}
          />
          <Fact
            label="Original deposit reference"
            mono
            value={refund?.reference_refunded}
          />
        </Section>
      ) : null}

      <Section
        blurb="What this movement earned sydHustle, what it cost us at the payment provider, and whether the user has ever disputed it."
        title="Books and disputes"
      >
        {detail.revenue.length === 0 ? (
          <Fact label="Platform revenue" value={null} />
        ) : (
          detail.revenue.map((row, index) => (
            <Fact
              key={`rev-${index}`}
              label={`Platform revenue · ${String(row.kind)}`}
              value={money(row.amount)}
            />
          ))
        )}
        {detail.provider_charges.length === 0 ? (
          <Fact label="Provider charge" value={null} />
        ) : (
          detail.provider_charges.map((row, index) => (
            <Fact
              key={`chg-${index}`}
              label={`${String(row.provider)} charge · ${String(row.kind)}${row.estimated ? " (estimated)" : ""}`}
              value={money(row.amount)}
            />
          ))
        )}
        {detail.reports.length === 0 ? (
          <Fact label="Disputes filed" value="None" />
        ) : (
          detail.reports.map((row, index) => (
            <div className="border-b border-white/5 py-2 last:border-0" key={`rep-${index}`}>
              <Fact label={`Dispute · ${String(row.reason)}`} value={row.status} />
              <Fact label="What they said" value={row.detail} />
              <Fact label="Resolution" value={row.resolution} />
              <Fact label="Filed at" value={when(row.created_at)} />
            </div>
          ))
        )}
      </Section>

      <p className="text-xs text-muted-foreground print:mt-6">
        Produced from the sydHustle wallet ledger, which is append-only.
        Fields shown as &ldquo;not recorded&rdquo; were never captured for
        this movement rather than being zero or withheld.
      </p>
    </div>
  );
}
