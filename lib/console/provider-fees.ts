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
 * 1. Paystack prices every local deposit channel identically, so there is
 *    no cheaper method to steer people towards on that rail. Payvessel
 *    does not: a bank transfer costs a third of a card at the same
 *    amount, which makes the method the user picks worth influencing.
 * 2. Payvessel is cheaper on BOTH rails, on published rates. Its bank
 *    transfer is 1% capped at ₦500 against Paystack's 1.5% plus ₦100
 *    capped at ₦2,000, and its payout tiers are ₦10/₦15/₦30 against
 *    ₦10/₦25/₦50. The catch is VAT: Payvessel quotes exclusive of it and
 *    Paystack inclusive, so add 7.5% to every Payvessel figure before
 *    treating the gap as real.
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

export const PAYVESSEL_FEES: ProviderFees = {
  provider: "payvessel",
  label: "Payvessel",
  checkedOn: "2026-08-15",
  sources: [{ label: "Payvessel pricing", url: "https://payvessel.com/pricing" }],
  payIn: [
    {
      label: "Bank transfer / virtual account",
      fee: "1%",
      note: "Capped at ₦500. This is the cheapest deposit channel either provider offers, and by a wide margin on larger top-ups.",
    },
    {
      label: "Cards",
      fee: "1.5%",
      note: "Capped at ₦2,500.",
    },
    { label: "USD", fee: "4.5%" },
  ],
  payOut: [
    { label: "Transfer of ₦5,000 or less", fee: "₦10" },
    { label: "Transfer of ₦5,001 to ₦50,000", fee: "₦15" },
    { label: "Transfer above ₦50,000", fee: "₦30" },
    {
      label: "Stamp duty, ₦10,000 and above",
      fee: "₦50",
      note: "NOT stated on Payvessel's pricing page. It is a statutory levy on transfers from a Nigerian balance rather than a provider fee, so it is assumed to apply and included in the margin table below. Confirm with Payvessel before relying on it.",
    },
  ],
  caveats: [
    "Every Payvessel rate above is quoted VAT EXCLUSIVE. Paystack quotes its fees inclusive, so the gap between them is smaller than the headline numbers suggest - add 7.5% to each Payvessel figure before comparing.",
    "Payvessel prices deposit channels differently, unlike Paystack. A bank transfer costs a third of what a card does at the same amount, which makes it the channel worth steering people towards.",
  ],
};

export const PROVIDER_FEES: Record<PaymentProvider, ProviderFees> = {
  paystack: PAYSTACK_FEES,
  payvessel: PAYVESSEL_FEES,
};

/* ------------------------------------------------------------------ */
/* What the rates actually cost                                        */
/* ------------------------------------------------------------------ */

/**
 * What a deposit of this size costs sydHustle. The user is credited the
 * full amount either way, so this is absorbed, never billed on.
 *
 * Quoted for a BANK TRANSFER, which is the default method in the app and
 * the one the two providers price most differently. Paystack charges the
 * same for every local channel; Payvessel charges a third as much for a
 * transfer as for a card, so a single "deposit cost" would be a fiction
 * on their side.
 */
export function depositCost(amount: number, provider: PaymentProvider) {
  if (provider === "payvessel") {
    // 1% capped at ₦500, VAT exclusive.
    return Math.min(Math.round(amount * 0.01 * 100) / 100, 500);
  }
  // Paystack: 1.5% plus a flat ₦100 at ₦2,500 and above, capped at ₦2,000.
  const flat = amount >= 2500 ? 100 : 0;
  return Math.min(Math.round((amount * 0.015 + flat) * 100) / 100, 2000);
}

/**
 * What a withdrawal at a given cut actually leaves behind.
 *
 * The interesting number is not the fee, it is the margin: the platform's
 * cut is a percentage while the provider's charge is flat, so the two
 * cross over somewhere and small withdrawals can cost more to send than
 * they earn. The tiers differ above ₦5,000: Payvessel charges ₦15 and
 * ₦30 where Paystack charges ₦25 and ₦50.
 */
export function withdrawalMargin(
  amount: number,
  cutPercent: number,
  provider: PaymentProvider = "paystack",
) {
  const cut = Math.round(((amount * cutPercent) / 100) * 100) / 100;
  const transferFee =
    amount <= 5000
      ? 10
      : provider === "payvessel"
        ? amount <= 50000
          ? 15
          : 30
        : amount <= 50000
          ? 25
          : 50;
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
