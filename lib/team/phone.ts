/**
 * One canonical shape for a phone number.
 *
 * The roster is the allowlist, so the admin typing a number and the team
 * member typing the same number have to land on the same database row.
 * They will not type it the same way: `080X XXXX XXX`, `080XXXXXXXX`,
 * `+234 80X XXX XXXX` and `234-80X-XXX-XXXX` are one number written four
 * ways. Everything is normalised to E.164 before it is written or looked
 * up, and the raw text is never stored.
 *
 * The examples here and in every placeholder on screen are deliberately
 * patterns rather than numbers. A plausible-looking Nigerian mobile in a
 * form field is somebody's actual phone, and sooner or later somebody
 * dials it.
 *
 * Nigeria is the default country because that is where sydHustle operates
 * and where everyone on the team so far is. A number that arrives with a `+`
 * keeps its own country code, so someone abroad can still be added.
 */

const NG_CODE = "234";

/** Local Nigerian mobile numbers are 0 + 10 digits. */
const NG_LOCAL = /^0\d{10}$/;
/** The same number with the leading 0 already dropped. */
const NG_BARE = /^[789]\d{9}$/;

export interface PhoneResult {
  ok: boolean;
  /** E.164, e.g. `+23480XXXXXXXX`. Empty when `ok` is false. */
  phone: string;
  error: string | null;
}

export function normalizePhone(raw: string | null | undefined): PhoneResult {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    return { ok: false, phone: "", error: "Enter a phone number." };
  }

  const international = trimmed.startsWith("+");
  // Everything that isn't a digit goes: spaces, dashes, brackets, the
  // (0) some people write inside an international number.
  const digits = trimmed.replace(/\D/g, "");

  if (!digits) {
    return { ok: false, phone: "", error: "That doesn't look like a phone number." };
  }

  // An explicit country code is taken at its word rather than second-guessed.
  if (international) {
    if (digits.length < 8 || digits.length > 15) {
      return { ok: false, phone: "", error: "That doesn't look like a phone number." };
    }
    return { ok: true, phone: `+${digits}`, error: null };
  }

  if (NG_LOCAL.test(digits)) {
    return { ok: true, phone: `+${NG_CODE}${digits.slice(1)}`, error: null };
  }
  if (NG_BARE.test(digits)) {
    return { ok: true, phone: `+${NG_CODE}${digits}`, error: null };
  }
  // 23480XXXXXXXX — the country code without the plus.
  if (digits.startsWith(NG_CODE) && digits.length === NG_CODE.length + 10) {
    return { ok: true, phone: `+${digits}`, error: null };
  }

  return {
    ok: false,
    phone: "",
    error:
      "Use the number the way you'd dial it — 11 digits starting with 0, or starting +234 from abroad.",
  };
}

/**
 * For display only. Groups a Nigerian number the way people read it aloud;
 * anything else is returned as it is rather than chopped into a shape it
 * doesn't have.
 */
export function formatPhone(phone: string): string {
  const ng = phone.match(/^\+234(\d{3})(\d{3})(\d{4})$/);
  if (!ng) return phone;
  return `+234 ${ng[1]} ${ng[2]} ${ng[3]}`;
}
