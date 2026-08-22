/**
 * Who runs the identity checks.
 *
 * Deliberately has NO `server-only` marker and imports nothing that
 * does: the switch is a Client Component and needs these labels and the
 * union, and pulling a server module into the browser bundle fails the
 * build. Same split, and same reason, as `payment-providers.ts`.
 */

export type KycProvider = "interswitch" | "payvessel";

export const KYC_PROVIDERS: KycProvider[] = ["interswitch", "payvessel"];

export const KYC_PROVIDER_LABELS: Record<KycProvider, string> = {
  interswitch: "Interswitch",
  payvessel: "Payvessel",
};

/**
 * What each rail can actually prove.
 *
 * The NIN check is a four-factor knowledge proof — both names, date of
 * birth, and state of origin. Only a provider whose record carries a
 * state can be asked for the fourth, and Payvessel's NIN profile
 * (names, gender, birth date, photo, phone) does not.
 *
 * This is not a footnote. Switching the NIN rail to a provider without
 * it means somebody holding a stolen NIN, the name on it and the date
 * of birth passes a check they would previously have failed. It is
 * shown next to the switch for that reason, and the app stops asking
 * for a state it cannot verify.
 */
export const NIN_CHECKS_STATE: Record<KycProvider, boolean> = {
  interswitch: true,
  payvessel: false,
};
