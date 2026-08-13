/**
 * Every in-app screen a promo banner can link to.
 *
 * The app's router refuses anything it doesn't recognise, so a typo in
 * the CTA field produces a button that does nothing rather than an
 * error anybody sees. This list exists so the field can be picked from
 * instead of typed from memory.
 *
 * Mirrors `src/app/` in the mobile repo. Routes with a `[param]`
 * segment are deliberately ABSENT — a banner is shown to everybody, and
 * `/chat/[conversationId]` has no meaning without knowing whose
 * conversation. Only screens that make sense to a stranger are listed.
 */

export type AppRoute = {
  path: string;
  label: string;
  note?: string;
};

export type AppRouteGroup = {
  group: string;
  routes: AppRoute[];
};

export const APP_ROUTES: AppRouteGroup[] = [
  {
    group: "Main tabs",
    routes: [
      { path: "/home", label: "Home", note: "The Hustle composer and feed" },
      { path: "/discover", label: "Skills", note: "The Skills tab" },
      { path: "/messages", label: "Messages" },
      { path: "/wallet", label: "Wallet" },
      { path: "/hustles", label: "Hustles", note: "Work in flight" },
    ],
  },
  {
    group: "Selling — what a Hustler pays for",
    routes: [
      {
        path: "/sms-paywall",
        label: "SMS alerts paywall",
        note: "₦300/week, ₦700/month",
      },
      {
        path: "/boost-paywall",
        label: "hustleBoost paywall",
        note: "Lifts a Skill into the Featured carousel",
      },
      { path: "/sms-alerts", label: "SMS alerts settings" },
      { path: "/add-skill", label: "Add a Skill", note: "The publish wizard" },
    ],
  },
  {
    group: "Money",
    routes: [
      { path: "/transactions", label: "Transactions" },
      { path: "/withdrawal-banks", label: "Withdrawal accounts" },
      { path: "/add-withdrawal-bank", label: "Add a withdrawal account" },
      { path: "/auto-withdrawals", label: "Automatic withdrawals" },
    ],
  },
  {
    group: "Account",
    routes: [
      { path: "/profile", label: "Profile" },
      { path: "/profile/edit", label: "Edit profile" },
      { path: "/profile/settings", label: "Settings" },
      {
        path: "/verify-identity",
        label: "Verify identity",
        note: "NIN check — gates withdrawals and in-person work",
      },
      { path: "/complete-profile", label: "Complete profile" },
      { path: "/notifications", label: "Notifications" },
      { path: "/performance", label: "Performance", note: "A Hustler's own numbers" },
    ],
  },
];

/** Flat list, for validation and for the datalist in the form. */
export const APP_ROUTE_PATHS: string[] = APP_ROUTES.flatMap((group) =>
  group.routes.map((route) => route.path),
);

/**
 * Where a banner can be placed.
 *
 * Skills is the surface this was built for. The rest default OFF —
 * Messages especially, which is a private conversation list rather than
 * a browsing surface, and an advert appearing there should be a
 * deliberate act.
 */
/**
 * `hasList` is what decides how many banners a surface can carry.
 *
 * Skills and Hustles are lists, so a banner can name a position inside
 * one and several can run at different depths. Home, Messages and
 * Wallet are single screens with nowhere to interleave: they show the
 * first two by order and ignore the position field entirely.
 */
export const PROMO_SURFACES = [
  { field: "show_on_skills", label: "Skills", defaultOn: true, hasList: true },
  { field: "show_on_home", label: "Home", defaultOn: false, hasList: false },
  { field: "show_on_hustles", label: "Hustles", defaultOn: false, hasList: true },
  { field: "show_on_wallet", label: "Wallet", defaultOn: false, hasList: false },
  { field: "show_on_messages", label: "Messages", defaultOn: false, hasList: false },
] as const;

export type PromoSurfaceField = (typeof PROMO_SURFACES)[number]["field"];
