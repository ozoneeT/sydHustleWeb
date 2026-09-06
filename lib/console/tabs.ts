/**
 * Every tab in the console, in one list.
 *
 * This is deliberately the ONLY place a tab is declared: the sidebar reads
 * it, the roles editor offers it as a checkbox, the proxy maps a URL to it,
 * and `requireConsole` demands one. A tab that isn't here can't be granted
 * to anyone; a tab added to the sidebar without being added here wouldn't
 * compile, because `ConsoleTab` is the union of these keys.
 *
 * The key is the first path segment after `/console`, which is what makes
 * the URL → permission mapping exact rather than a second list to keep in
 * step. `/console/transactions/<id>/<ref>` is the `transactions` tab.
 */

export const CONSOLE_TABS = [
  // Books
  { key: "overview", label: "Overview", group: "Books", icon: "LayoutDashboard" },
  { key: "earnings", label: "Earnings", group: "Books", icon: "CircleDollarSign" },
  { key: "costs", label: "Costs", group: "Books", icon: "Receipt" },
  { key: "transactions", label: "Transactions", group: "Books", icon: "Banknote" },
  { key: "withdrawals", label: "Withdrawals", group: "Books", icon: "Wallet" },
  { key: "payments", label: "Payments", group: "Books", icon: "CreditCard" },
  { key: "receipts", label: "Receipt check", group: "Books", icon: "ReceiptText" },
  {
    key: "transaction-reports",
    label: "Payment reports",
    group: "Books",
    icon: "ReceiptText",
  },

  // People
  { key: "users", label: "Users", group: "People", icon: "Users" },
  { key: "subscribers", label: "Subscribers", group: "People", icon: "Mail" },
  { key: "identity", label: "Identity", group: "People", icon: "Fingerprint" },
  {
    key: "certifications",
    label: "Certifications",
    group: "People",
    icon: "ShieldCheck",
  },

  // Risk
  { key: "reports", label: "Reports", group: "Risk", icon: "Flag" },
  { key: "appeals", label: "Appeals", group: "Risk", icon: "Gavel" },
  {
    key: "review-appeals",
    label: "Review appeals",
    group: "Risk",
    icon: "MessageSquareWarning",
  },
  { key: "moderation", label: "Moderation", group: "Risk", icon: "ShieldAlert" },
  { key: "listings", label: "Listings", group: "Risk", icon: "LayoutList" },
  { key: "holds", label: "Held funds", group: "Risk", icon: "Lock" },
  { key: "limits", label: "Money limits", group: "Risk", icon: "Gauge" },
  { key: "panic", label: "Panic", group: "Risk", icon: "Siren" },
  { key: "quiet-hours", label: "Quiet hours", group: "Risk", icon: "Moon" },
  { key: "location", label: "Location", group: "Risk", icon: "MapPin" },

  // Ops
  { key: "skills", label: "Skills", group: "Ops", icon: "Wrench" },
  { key: "featured", label: "Subscriptions", group: "Ops", icon: "Star" },
  { key: "promos", label: "Promotions", group: "Ops", icon: "BadgePercent" },
  { key: "broadcast", label: "Broadcast", group: "Ops", icon: "Megaphone" },
  { key: "campaigns", label: "Email campaigns", group: "Ops", icon: "MailPlus" },
] as const;

export type ConsoleTab = (typeof CONSOLE_TABS)[number]["key"];

export type ConsoleTabGroup = (typeof CONSOLE_TABS)[number]["group"];

export const CONSOLE_TAB_GROUPS: ConsoleTabGroup[] = [
  "Books",
  "People",
  "Risk",
  "Ops",
];

export const CONSOLE_TAB_KEYS: ConsoleTab[] = CONSOLE_TABS.map((tab) => tab.key);

const TAB_KEY_SET = new Set<string>(CONSOLE_TAB_KEYS);

export function isConsoleTab(value: string): value is ConsoleTab {
  return TAB_KEY_SET.has(value);
}

export function tabHref(key: ConsoleTab): string {
  return `/console/${key}`;
}

export function tabLabel(key: string): string {
  return CONSOLE_TABS.find((tab) => tab.key === key)?.label ?? key;
}

/**
 * Which tab a console URL belongs to.
 *
 * Returns null for `/console` itself and for anything under it that isn't a
 * tab — the login page, the invitation flow, the promo-art route. Those
 * carry their own rules, so a null here means "not governed by a tab
 * permission", never "allow everything".
 */
export function tabForPath(pathname: string): ConsoleTab | null {
  const segment = pathname.replace(/^\/console\/?/, "").split("/")[0];
  if (!segment) return null;
  return isConsoleTab(segment) ? segment : null;
}

/** Grouped for rendering, skipping any group the actor can't see at all. */
export function groupedTabs(allowed: readonly string[]) {
  const allowedSet = new Set(allowed);
  return CONSOLE_TAB_GROUPS.map((group) => ({
    label: group,
    tabs: CONSOLE_TABS.filter(
      (tab) => tab.group === group && allowedSet.has(tab.key)
    ),
  })).filter((group) => group.tabs.length > 0);
}
