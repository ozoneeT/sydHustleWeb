import "server-only";

import type {
  PaymentProvider,
  PaymentRails,
  RailReadiness,
} from "@/lib/console/payment-providers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Reading whether each provider could actually serve each rail.
 *
 * The vocabulary (the provider names, the labels, the shapes) lives in
 * `payment-providers.ts`, which the client-side switch imports. Only this
 * half is server-only, because only this half holds a service-role call.
 */

const UNKNOWN: RailReadiness = { configured: false, live: null, missing: [] };

/**
 * Asks the edge runtime which credentials it actually has.
 *
 * It has to be asked rather than checked here: provider secrets live in
 * Supabase function secrets, which this app's environment cannot see. The
 * point is to stop the switch from being a blind one - a rail with no
 * keys fails every payment, and the failure is invisible until a user
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

export type { PaymentProvider, PaymentRails, RailReadiness };
