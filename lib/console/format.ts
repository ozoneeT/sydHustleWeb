export function naira(value: number): string {
  return `₦${value.toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * A NIP settlement ID, grouped in fives.
 *
 * Thirty unbroken characters get misread when someone on the support desk
 * reads them back to a caller, and fives divide thirty exactly. Anything
 * that is not the canonical length is returned untouched rather than
 * chopped into a shape it does not have — a provider sandbox returns
 * short placeholder session ids, and slicing those into groups would make
 * a stub look like the real thing.
 *
 * Display only. Anything pasted into a bank's search box or a provider's
 * support form must be the raw value.
 */
export function settlementId(value: string): string {
  if (value.length !== 30) return value;
  return (value.match(/.{1,5}/g) ?? [value]).join(" ");
}

export function shortDate(value: string): string {
  return new Date(value).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
