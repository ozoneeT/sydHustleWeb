import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/** All reads for the console. Service-role, server-only — nothing here is
 * reachable without a console session (pages call requireConsole first). */

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
    withdrawal_fees: number;
    escrow_fees: number;
    sms_fees?: number;
    total_30d: number;
  };
  generated_at: string;
};

export type PlatformSettings = {
  withdrawal_cut_percent: number;
  escrow_cut_percent: number;
  escrow_cut_applies_to: "none" | "provider" | "hustler" | "both";
  sms_daily_price: number;
  sms_weekly_price: number;
  sms_monthly_price: number;
  /** Naira to open a slot to change the SMS alert number. */
  sms_number_change_fee: number;
  updated_at: string;
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("platform_settings")
    .select(
      "withdrawal_cut_percent, escrow_cut_percent, escrow_cut_applies_to, sms_daily_price, sms_weekly_price, sms_monthly_price, sms_number_change_fee, updated_at"
    )
    .eq("id", 1)
    .single();
  if (error) throw new Error(error.message);
  return {
    ...data,
    withdrawal_cut_percent: Number(data.withdrawal_cut_percent),
    escrow_cut_percent: Number(data.escrow_cut_percent),
    sms_daily_price: Number(data.sms_daily_price),
    sms_weekly_price: Number(data.sms_weekly_price),
    sms_monthly_price: Number(data.sms_monthly_price),
    sms_number_change_fee: Number(data.sms_number_change_fee),
  } as PlatformSettings;
}

export async function getConsoleStats(): Promise<ConsoleStats> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc("console_stats");
  if (error) throw new Error(error.message);
  return data as ConsoleStats;
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
};

export async function listRecentLedger(): Promise<LedgerRow[]> {
  const supabase = createServerSupabaseClient();
  // No FK from ledger to profiles (the ledger deliberately stands alone),
  // so names are fetched separately and joined here.
  const { data, error } = await supabase
    .from("wallet_ledger")
    .select("id, created_at, direction, amount, reason, reference, profile_id")
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

  return rows.map((row) => ({
    id: row.id,
    created_at: row.created_at,
    direction: row.direction,
    amount: Number(row.amount),
    reason: row.reason,
    reference: row.reference,
    profile_name: nameById.get(row.profile_id) ?? null,
  }));
}

export type WithdrawalRow = {
  id: string;
  created_at: string;
  amount: number;
  status: string;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  failure_reason: string | null;
  profile_name: string | null;
  /** Still pending well past the normal few seconds — usually means the
   * Paystack balance couldn't cover it and the retry loop is waiting. */
  queued_long: boolean;
};

export async function listWithdrawals(): Promise<WithdrawalRow[]> {
  const supabase = createServerSupabaseClient();
  // The bank's display name lives on the saved account the withdrawal
  // was created from; the withdrawal row itself only snapshots the code.
  const { data, error } = await supabase
    .from("withdrawals")
    .select(
      "id, created_at, amount, status, bank_code, account_number, account_name, failure_reason, profiles(full_name), withdrawal_accounts(bank_name)"
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);

  type Row = {
    id: string;
    created_at: string;
    amount: number | string;
    status: string;
    bank_code: string | null;
    account_number: string | null;
    account_name: string | null;
    failure_reason: string | null;
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
      status: row.status,
      bank_name: account?.bank_name ?? row.bank_code,
      account_number: row.account_number,
      account_name: row.account_name,
      failure_reason: row.failure_reason,
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
  pending_plan: string | null;
  pending_prepaid_amount: number | null;
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
      "profile_id, phone, plan, status, auto_renew, current_period_end, pending_plan, pending_prepaid_amount, created_at"
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  type Row = Omit<SubscriberRow, "profile_name" | "live" | "pending_prepaid_amount"> & {
    pending_prepaid_amount: string | number | null;
  };
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
    pending_prepaid_amount:
      row.pending_prepaid_amount === null
        ? null
        : Number(row.pending_prepaid_amount),
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
