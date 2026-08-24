import "server-only";

import type { KycProvider } from "@/lib/console/kyc-providers";
import type { PaymentProvider } from "@/lib/console/payment-providers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** All reads for the console. Service-role, server-only — panel routes are
 * gated by proxy.ts; mutations still call requireConsole in their actions. */

export type ConsoleStats = {
  users: { total: number; new_7d: number };
  wallets: { liability: number };
  escrow: {
    held_sum: number;
    held_count: number;
    released_sum: number;
    fees_earned: number;
  };
  flows: {
    deposits_total: number;
    deposits_30d: number;
    money_in_30d: number;
    money_out_30d: number;
  };
  withdrawals: {
    paid_sum: number;
    paid_count: number;
    in_flight_sum: number;
    in_flight_count: number;
  };
  revenue: {
    total: number;
    /** The main stream: sydHustle's cut of every released Hustle. */
    release_fees: number;
    release_fees_30d: number;
    escrow_fees: number;
    sms_fees?: number;
    feature_fees?: number;
    /** Zero going forward - withdrawals are free - and non-zero for the
     * period before the cut moved to releases. */
    withdrawal_fees: number;
    total_30d: number;
  };
  /** Collected from users and remitted to government. Neither revenue nor
   * cost: it passes straight through. */
  levies: {
    stamp_duty_collected: number;
    stamp_duty_30d: number;
  };
  generated_at: string;
};

export type PlatformSettings = {
  withdrawal_cut_percent: number;
  /** Flat naira on top of the percentage, and the ceiling on the two
   * together. Null cap means uncapped. Zero everywhere means free. */
  withdrawal_fee_flat: number;
  withdrawal_fee_cap: number | null;
  /** sydHustle's cut of money added, charged ON TOP of the payment
   * provider's own. Zero means the payer bears only the provider's. */
  deposit_fee_percent: number;
  deposit_fee_flat: number;
  deposit_fee_cap: number | null;
  escrow_cut_percent: number;
  escrow_cut_applies_to: "none" | "provider" | "hustler" | "both";
  sms_weekly_price: number;
  sms_monthly_price: number;
  /** Texts a subscriber gets per billing period. Enforced by the send
   * worker, and stated on the app's plan picker, which reads these
   * rather than shipping a copy - so raising one here is visible to
   * users without a release. The store listing's description is the
   * one place that does NOT follow automatically: change it too, or the
   * subscription delivers something other than what it advertises. */
  sms_weekly_cap: number;
  sms_monthly_cap: number;
  /** A government levy on payouts at or above the threshold, passed
   * through at cost. Never sydHustle revenue. */
  stamp_duty_amount: number;
  stamp_duty_threshold: number;
  /** What each store keeps of an in-app purchase. Used to estimate the
   * cost line against store revenue, which is booked gross. */
  apple_commission_percent: number;
  google_commission_percent: number;
  /** Which provider takes money in, and which sends it out. Independent
   * on purpose - see lib/console/payments.ts. */
  funding_provider: PaymentProvider;
  payout_provider: PaymentProvider;
  /** Who runs the NIN and BVN lookups. Independent of each other and of
   * the money rails - separate products, separate outages, separate
   * prices. See lib/console/kyc-providers.ts. */
  nin_provider: KycProvider;
  bvn_provider: KycProvider;
  updated_at: string;
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("platform_settings")
    .select(
      "withdrawal_cut_percent, withdrawal_fee_flat, withdrawal_fee_cap, deposit_fee_percent, deposit_fee_flat, deposit_fee_cap, escrow_cut_percent, escrow_cut_applies_to, sms_weekly_price, sms_monthly_price, sms_weekly_cap, sms_monthly_cap, stamp_duty_amount, stamp_duty_threshold, apple_commission_percent, google_commission_percent, funding_provider, payout_provider, nin_provider, bvn_provider, updated_at"
    )
    .eq("id", 1)
    .single();
  if (error) throw new Error(error.message);
  return {
    ...data,
    withdrawal_cut_percent: Number(data.withdrawal_cut_percent),
    withdrawal_fee_flat: Number(data.withdrawal_fee_flat ?? 0),
    withdrawal_fee_cap:
      data.withdrawal_fee_cap === null ? null : Number(data.withdrawal_fee_cap),
    deposit_fee_percent: Number(data.deposit_fee_percent ?? 0),
    deposit_fee_flat: Number(data.deposit_fee_flat ?? 0),
    deposit_fee_cap:
      data.deposit_fee_cap === null ? null : Number(data.deposit_fee_cap),
    stamp_duty_amount: Number(data.stamp_duty_amount ?? 0),
    stamp_duty_threshold: Number(data.stamp_duty_threshold ?? 0),
    apple_commission_percent: Number(data.apple_commission_percent ?? 0),
    google_commission_percent: Number(data.google_commission_percent ?? 0),
    escrow_cut_percent: Number(data.escrow_cut_percent),
    sms_weekly_price: Number(data.sms_weekly_price),
    sms_monthly_price: Number(data.sms_monthly_price),
    sms_weekly_cap: Number(data.sms_weekly_cap),
    sms_monthly_cap: Number(data.sms_monthly_cap),
  } as PlatformSettings;
}

export async function getConsoleStats(): Promise<ConsoleStats> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc("console_stats");
  if (error) throw new Error(error.message);
  // Read loosely, returned strictly. The console deploys separately from
  // the schema, so a database still on the previous `console_stats` is a
  // normal state for a few minutes - and a missing key should render as
  // zero rather than crash the page it appears on.
  const stats = data as Partial<ConsoleStats> & {
    revenue?: Partial<ConsoleStats["revenue"]>;
    levies?: Partial<ConsoleStats["levies"]>;
  };
  const revenue: Partial<ConsoleStats["revenue"]> = stats.revenue ?? {};
  const levies: Partial<ConsoleStats["levies"]> = stats.levies ?? {};
  return {
    ...(stats as ConsoleStats),
    revenue: {
      total: revenue.total ?? 0,
      release_fees: revenue.release_fees ?? 0,
      release_fees_30d: revenue.release_fees_30d ?? 0,
      escrow_fees: revenue.escrow_fees ?? 0,
      sms_fees: revenue.sms_fees ?? 0,
      feature_fees: revenue.feature_fees ?? 0,
      withdrawal_fees: revenue.withdrawal_fees ?? 0,
      total_30d: revenue.total_30d ?? 0,
    },
    levies: {
      stamp_duty_collected: levies.stamp_duty_collected ?? 0,
      stamp_duty_30d: levies.stamp_duty_30d ?? 0,
    },
  };
}

export type ConsoleUser = {
  id: string;
  full_name: string | null;
  school: string | null;
  created_at: string;
  balance: number;
  email: string | null;
};

export async function listUsers(search?: string): Promise<ConsoleUser[]> {
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("profiles")
    .select("id, full_name, school, created_at, wallets(balance)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (search && search.trim().length > 0) {
    query = query.ilike("full_name", `%${search.trim()}%`);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // Emails live in auth, not in profiles; one admin list covers the page.
  const emailById = new Map<string, string>();
  const { data: authUsers } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  for (const user of authUsers?.users ?? []) {
    if (user.email) emailById.set(user.id, user.email);
  }

  type Row = {
    id: string;
    full_name: string | null;
    school: string | null;
    created_at: string;
    wallets: { balance: number | string }[] | { balance: number | string } | null;
  };

  return ((data ?? []) as Row[]).map((row) => {
    const wallet = Array.isArray(row.wallets) ? row.wallets[0] : row.wallets;
    return {
      id: row.id,
      full_name: row.full_name,
      school: row.school,
      created_at: row.created_at,
      balance: Number(wallet?.balance ?? 0),
      email: emailById.get(row.id) ?? null,
    };
  });
}

export type LedgerRow = {
  id: string;
  created_at: string;
  direction: "credit" | "debit";
  amount: number;
  reason: string;
  reference: string | null;
  profile_name: string | null;
  /**
   * The NIP session ID — what the user's own bank can trace, as opposed
   * to `reference`, which means nothing outside sydHustle.
   *
   * WITHDRAWALS ONLY. A payout is a transfer we put on the interbank
   * rail, so NIBSS stamps it; a deposit is a charge the provider
   * collected, which never settles under our instruction and has no
   * session id to give. Deposits carry `provider_reference` instead, and
   * that is not a lesser version of this — it is the correct identifier
   * for what happened. Also null on a payout still in flight, because the
   * rail stamps it on arrival.
   */
  settlement_id: string | null;
  /**
   * The provider's own handle, and whose desk resolves it.
   *
   * The console names the provider where the app deliberately does not:
   * an operator with a reference in front of them still has to decide
   * whether to open Paystack or Payvessel, and one row carrying both
   * answers is the difference between a phone call and a hunt.
   */
  provider_reference: string | null;
  provider: string | null;
};

export async function listRecentLedger(): Promise<LedgerRow[]> {
  const supabase = createServerSupabaseClient();
  // No FK from ledger to profiles (the ledger deliberately stands alone),
  // so names are fetched separately and joined here.
  const { data, error } = await supabase
    .from("wallet_ledger")
    .select(
      "id, created_at, direction, amount, reason, reference, profile_id, source_type, source_id, settlement_id, provider_reference"
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);

  type Row = {
    id: string;
    created_at: string;
    direction: "credit" | "debit";
    amount: number | string;
    reason: string;
    reference: string | null;
    profile_id: string;
    source_type: string | null;
    source_id: string | null;
    settlement_id: string | null;
    provider_reference: string | null;
  };

  const rows = (data ?? []) as Row[];
  const ids = [...new Set(rows.map((row) => row.profile_id))];
  const nameById = new Map<string, string | null>();
  if (ids.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", ids);
    for (const profile of profiles ?? []) {
      nameById.set(profile.id, profile.full_name);
    }
  }

  // Only ONE kind of entry carries its provider identifiers on the ledger
  // row: a credit into a permanent virtual account, which has no other
  // row describing it anywhere. Withdrawals and checkout deposits keep
  // theirs on the withdrawal or the intent, because those arrive after
  // the ledger entry was written and the ledger is append-only. So both
  // are fetched and folded in here, batched by source type rather than
  // one query per row.
  type Trace = {
    settlementId: string | null;
    providerReference: string | null;
    provider: string | null;
  };
  const traceBySource = new Map<string, Trace>();
  const sourceIds = (type: string) => [
    ...new Set(
      rows
        .filter((row) => row.source_type === type && row.source_id)
        .map((row) => row.source_id as string)
    ),
  ];

  const withdrawalIds = sourceIds("withdrawal");
  if (withdrawalIds.length > 0) {
    const { data: withdrawals } = await supabase
      .from("withdrawals")
      .select("id, session_id, provider_reference, provider")
      .in("id", withdrawalIds);
    for (const row of withdrawals ?? []) {
      traceBySource.set(`withdrawal:${row.id}`, {
        settlementId: row.session_id,
        providerReference: row.provider_reference,
        provider: row.provider,
      });
    }
  }

  const intentIds = sourceIds("payment_intent");
  if (intentIds.length > 0) {
    const { data: intents } = await supabase
      .from("payment_intents")
      .select("id, session_id, provider_reference, provider")
      .in("id", intentIds);
    for (const row of intents ?? []) {
      traceBySource.set(`payment_intent:${row.id}`, {
        // Deposits do not get one. The column exists and is read here so
        // that a provider who starts sending one is captured without a
        // schema change, but nothing displays it as a deposit's identity.
        settlementId: row.session_id,
        providerReference: row.provider_reference,
        provider: row.provider,
      });
    }
  }

  // A virtual-account credit points at the ACCOUNT, so the provider comes
  // off that row rather than off anything transaction-shaped.
  const accountIds = sourceIds("virtual_account");
  if (accountIds.length > 0) {
    const { data: accounts } = await supabase
      .from("virtual_accounts")
      .select("id, provider")
      .in("id", accountIds);
    for (const row of accounts ?? []) {
      traceBySource.set(`virtual_account:${row.id}`, {
        settlementId: null,
        providerReference: null,
        provider: row.provider,
      });
    }
  }

  return rows.map((row) => {
    const trace =
      row.source_type && row.source_id
        ? traceBySource.get(`${row.source_type}:${row.source_id}`)
        : undefined;
    return {
      id: row.id,
      created_at: row.created_at,
      direction: row.direction,
      amount: Number(row.amount),
      reason: row.reason,
      reference: row.reference,
      profile_name: nameById.get(row.profile_id) ?? null,
      // The ledger row wins where it has a value: that is the
      // virtual-account case, which has no source row to read from.
      settlement_id: row.settlement_id ?? trace?.settlementId ?? null,
      provider_reference:
        row.provider_reference ?? trace?.providerReference ?? null,
      provider: trace?.provider ?? null,
    };
  });
}

export type WithdrawalRow = {
  id: string;
  created_at: string;
  /** What left the wallet. */
  amount: number;
  /** Stamp duty taken off it, and what the bank was actually sent. The
   * pair exists so support can answer "why is my transfer ₦50 short"
   * without opening a SQL client. */
  levy: number;
  net: number;
  status: string;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  failure_reason: string | null;
  profile_name: string | null;
  /** Still pending well past the normal few seconds — usually means the
   * Paystack balance couldn't cover it and the retry loop is waiting. */
  queued_long: boolean;
  /**
   * The NIP session ID, once the rail has stamped one.
   *
   * This is the number the user's bank asks for, so it is also the number
   * support has to be able to read off the console the moment someone
   * calls saying a payout never landed. Null while a transfer is still in
   * flight and null throughout a provider test mode.
   */
  session_id: string | null;
  /** The provider's own handle for the transfer, and whose desk it
   * belongs to. Kept apart from the session id because a bank cannot
   * trace a `TRF_` code and a provider cannot be handed a session id
   * without also being told the transfer was theirs. */
  provider_reference: string | null;
  provider: string | null;
};

export async function listWithdrawals(): Promise<WithdrawalRow[]> {
  const supabase = createServerSupabaseClient();
  // The bank's display name lives on the saved account the withdrawal
  // was created from; the withdrawal row itself only snapshots the code.
  const { data, error } = await supabase
    .from("withdrawals")
    .select(
      "id, created_at, amount, fee, levy, status, bank_code, account_number, account_name, failure_reason, session_id, provider_reference, provider, profiles(full_name), withdrawal_accounts(bank_name)"
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);

  type Row = {
    id: string;
    created_at: string;
    amount: number | string;
    fee: number | string | null;
    levy: number | string | null;
    status: string;
    bank_code: string | null;
    account_number: string | null;
    account_name: string | null;
    failure_reason: string | null;
    session_id: string | null;
    provider_reference: string | null;
    provider: string | null;
    profiles: { full_name: string | null } | { full_name: string | null }[] | null;
    withdrawal_accounts:
      | { bank_name: string | null }
      | { bank_name: string | null }[]
      | null;
  };

  const now = Date.now();
  return ((data ?? []) as Row[]).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const account = Array.isArray(row.withdrawal_accounts)
      ? row.withdrawal_accounts[0]
      : row.withdrawal_accounts;
    return {
      id: row.id,
      created_at: row.created_at,
      amount: Number(row.amount),
      levy: Number(row.levy ?? 0),
      net: Number(row.amount) - Number(row.fee ?? 0) - Number(row.levy ?? 0),
      status: row.status,
      bank_name: account?.bank_name ?? row.bank_code,
      account_number: row.account_number,
      account_name: row.account_name,
      failure_reason: row.failure_reason,
      session_id: row.session_id,
      provider_reference: row.provider_reference,
      provider: row.provider,
      profile_name: profile?.full_name ?? null,
      queued_long:
        row.status === "pending" &&
        now - new Date(row.created_at).getTime() > 5 * 60 * 1000,
    };
  });
}

export type SubscriberRow = {
  profile_id: string;
  profile_name: string | null;
  phone: string;
  plan: string;
  status: string;
  auto_renew: boolean;
  current_period_end: string;
  created_at: string;
  /** Paid-up right now — status alone lags, since the renewal job runs
   * hourly and a lapsed row keeps saying 'active' until it fires. */
  live: boolean;
};

export async function listSubscribers(): Promise<SubscriberRow[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("sms_subscriptions")
    .select(
      // No `pending_plan`/`pending_prepaid_amount`: 20260810070000
      // dropped them when SMS billing moved to the app stores. Switching
      // plans inside a subscription group is Apple's and Google's job and
      // they prorate it themselves, so there is no pending switch for us
      // to hold — and selecting the columns broke the whole build.
      "profile_id, phone, plan, status, auto_renew, current_period_end, created_at"
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  type Row = Omit<SubscriberRow, "profile_name" | "live">;
  const rows = (data ?? []) as Row[];

  // No FK from subscriptions to profiles for PostgREST to follow, so the
  // names come separately.
  const ids = [...new Set(rows.map((row) => row.profile_id))];
  const nameById = new Map<string, string | null>();
  if (ids.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", ids);
    for (const profile of profiles ?? []) {
      nameById.set(profile.id, profile.full_name);
    }
  }

  const now = Date.now();
  return rows.map((row) => ({
    ...row,
    profile_name: nameById.get(row.profile_id) ?? null,
    live:
      row.status === "active" &&
      new Date(row.current_period_end).getTime() > now,
  }));
}

export type ModerationRow = {
  id: string;
  created_at: string;
  source: string;
  outcome: string;
  reason: string | null;
  actor_name: string | null;
  content_snapshot: string | null;
};

export async function listModerationQueue(): Promise<ModerationRow[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("moderation_queue")
    .select("id, created_at, source, outcome, reason, actor_name, content_snapshot")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []) as ModerationRow[];
}

export type BroadcastRow = {
  id: string;
  title: string;
  body: string;
  url: string;
  filters: Record<string, unknown>;
  note: string | null;
  recipients: number;
  delivered: number;
  opened: number;
  created_at: string;
};

/**
 * What has been sent, and how it landed.
 *
 * Delivery and open counts come off the receipts the app already writes
 * (`notifications.delivered_at` from the device ack, `read_at` from the
 * notification centre), so they cost nothing to collect. Read them as
 * "at least this many": a user who deletes a notification deletes the
 * row the receipt lived on.
 */
export async function listBroadcasts(): Promise<BroadcastRow[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("console_broadcast_results")
    .select(
      "id, title, body, url, filters, note, recipients, delivered, opened, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(25);
  if (error) throw new Error(error.message);
  return (data ?? []) as BroadcastRow[];
}
