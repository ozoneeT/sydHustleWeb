import type { PaymentProvider } from "@/lib/console/payment-providers";

/**
 * What the payment providers charge sydHustle.
 *
 * Reference data, not live data: these are published rates, so they are
 * written down here rather than fetched. That makes them exactly as
 * trustworthy as the date they were last checked, which is why
 * `checkedOn` and `sources` sit next to the numbers instead of in a commit
 * message nobody will find.
 *
 * Two things are worth knowing before reading any of it:
 *
 * 1. Neither provider prices deposit channels differently. Cards, bank
 *    transfer, USSD and the bank list all cost the same on both. Steering
 *    users towards a "cheaper" deposit method is not a lever that exists.
 * 2. The providers differ on money IN and are identical on money OUT.
 *    Paystack adds a flat ₦100 to every local deposit over ₦2,500 that
 *    OPay does not charge at all; their payout tiers are the same three
 *    numbers. So the deposit rail is where the choice costs money.
 */

export type FeeRow = {
  label: string;
  fee: string;
  note?: string;
};

export type ProviderFees = {
  provider: PaymentProvider;
  label: string;
  /** ISO date these figures were last checked against the source. */
  checkedOn: string;
  sources: { label: string; url: string }[];
  payIn: FeeRow[];
  payOut: FeeRow[];
  caveats: string[];
};

export const PAYSTACK_FEES: ProviderFees = {
  provider: "paystack",
  label: "Paystack",
  checkedOn: "2026-08-15",
  sources: [
    {
      label: "Transactions pricing",
      url: "https://support.paystack.com/en/articles/2130306",
    },
    {
      label: "Transfers pricing",
      url: "https://support.paystack.com/en/articles/2130370",
    },
    {
      label: "Stamp duty on NGN transfers",
      url: "https://support.paystack.com/en/articles/7573314",
    },
  ],
  payIn: [
    {
      label: "All local channels",
      fee: "1.5% + ₦100",
      note: "Cards, bank transfer, USSD and Pay with Bank are priced identically. Capped at ₦2,000.",
    },
    {
      label: "Local, under ₦2,500",
      fee: "1.5%",
      note: "The ₦100 is waived below ₦2,500.",
    },
    { label: "International cards", fee: "3.9% + ₦100", note: "Amex 4.5%." },
    { label: "USD", fee: "1%", note: "Capped at ₦300." },
  ],
  payOut: [
    { label: "Transfer of ₦5,000 or less", fee: "₦10" },
    { label: "Transfer of ₦5,001 to ₦50,000", fee: "₦25" },
    { label: "Transfer above ₦50,000", fee: "₦50" },
    {
      label: "Stamp duty, ₦10,000 and above",
      fee: "₦50",
      note: "Government levy under the Nigeria Tax Act 2025, charged from 18 February 2026 on top of the transfer fee.",
    },
  ],
  caveats: [
    "Transfer charges come out of the Paystack balance, not out of the amount sent. A balance that cannot cover amount plus fee fails the transfer, which is what leaves a withdrawal queued.",
  ],
};

export const OPAY_FEES: ProviderFees = {
  provider: "opay",
  label: "OPay",
  checkedOn: "2026-08-15",
  sources: [
    { label: "OPay Checkout pricing", url: "https://www.opaycheckout.com/pricing.html" },
  ],
  payIn: [
    {
      label: "All local channels",
      fee: "1.5%",
      note: "No flat fee at any amount, which is the whole difference from Paystack. Capped at ₦2,000.",
    },
    { label: "International", fee: "4%" },
  ],
  payOut: [
    { label: "Transfer of ₦5,000 or less", fee: "₦10" },
    { label: "Transfer of ₦5,001 to ₦50,000", fee: "₦25" },
    { label: "Transfer above ₦50,000", fee: "₦50" },
    {
      label: "Payout to an OPay wallet",
      fee: "₦5",
      note: "Cheaper than a bank transfer, but we cannot target it: a withdrawal goes wherever the user's saved bank points, and OPay is one entry in that list.",
    },
    {
      label: "Stamp duty, ₦10,000 and above",
      fee: "₦50",
      note: "NOT stated on OPay's pricing page. It is a statutory levy on transfers from a Nigerian balance rather than a provider fee, so it is assumed to apply and included in the margin table below. Confirm with OPay before relying on it.",
    },
  ],
  caveats: [
    "These are OPay's published Standard Plan rates. They offer a customised plan at volume, so a negotiated rate may differ from what is shown here.",
    "OPay publishes far less than Paystack does: there is no per-channel breakdown and no settlement detail on the pricing page.",
  ],
};

export const PROVIDER_FEES: Record<PaymentProvider, ProviderFees> = {
  paystack: PAYSTACK_FEES,
  opay: OPAY_FEES,
};

/* ------------------------------------------------------------------ */
/* What the rates actually cost                                        */
/* ------------------------------------------------------------------ */

/** What a deposit of this size costs sydHustle. The user is credited the
 * full amount either way, so this is absorbed, never billed on. */
export function depositCost(amount: number, provider: PaymentProvider) {
  const percent = amount * 0.015;
  // Paystack's flat ₦100 applies at ₦2,500 and above; OPay has none.
  const flat = provider === "paystack" && amount >= 2500 ? 100 : 0;
  return Math.min(Math.round((percent + flat) * 100) / 100, 2000);
}

/**
 * What a withdrawal at a given cut actually leaves behind.
 *
 * The interesting number is not the fee, it is the margin: the platform's
 * cut is a percentage while the provider's charge is flat, so the two
 * cross over somewhere and small withdrawals can cost more to send than
 * they earn. Both providers charge the same three tiers, so this is
 * provider-independent.
 */
export function withdrawalMargin(amount: number, cutPercent: number) {
  const cut = Math.round(((amount * cutPercent) / 100) * 100) / 100;
  const transferFee = amount <= 5000 ? 10 : amount <= 50000 ? 25 : 50;
  const stampDuty = amount >= 10000 ? 50 : 0;
  const providerCost = transferFee + stampDuty;
  return { cut, transferFee, stampDuty, providerCost, net: cut - providerCost };
}

/** The withdrawal floor, the stamp-duty threshold either side, and a few
 * round numbers between. */
export const MARGIN_SAMPLES = [500, 1000, 5000, 9999, 10000, 50000, 100000];

/** Spans the ₦2,500 waiver boundary, which is where the two providers
 * stop costing the same. */
export const DEPOSIT_SAMPLES = [500, 1000, 2500, 5000, 10000, 50000];
