import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Which payment provider is on which rail, and whether it could actually
 * work.
 *
 * sydHustle integrates two providers in full, not one and a half:
 * Paystack and OPay each handle money in and money out on their own. A
 * business does not go live on both at the same moment - one can be live
 * while the other is still in test - so which one is real right now
 * belongs to whoever runs the business, in this console.
 *
 * Two settings rather than one, because the two directions are genuinely
 * independent: whoever takes deposits owns every funding method, and
 * whoever sends payouts owns the bank list and the account verification
 * that go with them.
 */

export type PaymentProvider = "paystack" | "opay";

export const PROVIDER_LABELS: Record<PaymentProvider, string> = {
  paystack: "Paystack",
  opay: "OPay",
};

export type RailReadiness = {
  /** Whether the secrets this provider needs for this rail are set. */
  configured: boolean;
  /** Live or test, as far as the credentials themselves reveal. */
  live: boolean | null;
  /** The secrets it needs and does not have. */
  missing: string[];
};

export type PaymentRails = {
  funding: Record<PaymentProvider, RailReadiness>;
  payout: Record<PaymentProvider, RailReadiness>;
};

const UNKNOWN: RailReadiness = { configured: false, live: null, missing: [] };

/**
 * Asks the edge runtime which credentials it actually has.
 *
 * It has to be asked rather than checked here: provider secrets live in
 * Supabase function secrets, which this app's environment cannot see. The
 * point is to stop the switch below from being a blind one - a rail with
 * no keys fails every payment, and the failure is invisible until a user
 * hits it.
 *
 * A failure to reach the function is reported as "unknown", never as
 * "not configured": telling an operator their live rail is unconfigured
 * because a function was briefly unreachable would be worse than saying
 * nothing.
 */
export async function getPaymentRails(): Promise<PaymentRails | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.functions.invoke<{
    rails?: PaymentRails;
  }>("payment-rails", { body: {} });

  if (error || !data?.rails) return null;

  return {
    funding: {
      paystack: data.rails.funding?.paystack ?? UNKNOWN,
      opay: data.rails.funding?.opay ?? UNKNOWN,
    },
    payout: {
      paystack: data.rails.payout?.paystack ?? UNKNOWN,
      opay: data.rails.payout?.opay ?? UNKNOWN,
    },
  };
}
