/**
 * Which payment provider is on which rail: the vocabulary, shared by the
 * server and the browser.
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
 *
 * Deliberately NOT `server-only`, unlike its sibling `payments.ts`: the
 * switch is a client component, and it needs these labels and types. The
 * service-role call that reads credential readiness stays next door,
 * where the guard belongs.
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
