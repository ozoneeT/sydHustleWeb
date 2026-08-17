import type { PromoBannerRow } from "@/lib/console/promos";

/**
 * Starting points, not templates.
 *
 * Picking one fills the form and nothing more — every field stays
 * editable afterwards, and saving stores plain values with no link back
 * to the preset. That is deliberate: a preset that kept editing a live
 * banner would mean changing one here silently rewrote campaigns that
 * were already running.
 *
 * Colours are given per scheme because one pair cannot serve both. Each
 * dark variant is deep enough to sit on the dark feed without glowing;
 * each light variant is tinted rather than white, so the card still
 * reads as a card on a pale page.
 */

export type PromoPreset = {
  id: string;
  name: string;
  description: string;
  values: Partial<PromoBannerRow>;
};

/**
 * The icons a banner can use.
 *
 * A curated list rather than free text, because two renderers have to
 * draw it: the app from Ionicons, the console preview from Lucide. A
 * name outside this list would render on the phone and show as a blank
 * in the preview — the worst of both. `lucide` maps each to its nearest
 * equivalent so the preview stays honest.
 */
export const PROMO_ICONS = [
  { value: "chatbubble-ellipses", label: "Message", lucide: "MessageCircle" },
  { value: "rocket", label: "Rocket", lucide: "Rocket" },
  { value: "shield-checkmark", label: "Shield", lucide: "ShieldCheck" },
  { value: "trending-up", label: "Growth", lucide: "TrendingUp" },
  { value: "wallet", label: "Wallet", lucide: "Wallet" },
  { value: "flash", label: "Fast", lucide: "Zap" },
  { value: "star", label: "Star", lucide: "Star" },
  { value: "gift", label: "Gift", lucide: "Gift" },
  { value: "megaphone", label: "Announce", lucide: "Megaphone" },
] as const;

export const PROMO_PRESETS: PromoPreset[] = [
  {
    id: "sms",
    name: "SMS alerts",
    description: "The offline-booking pitch. Brand teal, message icon.",
    values: {
      kind: "custom",
      eyebrow: "NEVER MISS A BOOKING",
      title: "Get a text the moment someone books you",
      subtitle: "Even when you're offline. From ₦300 a week.",
      cta_label: "Turn on SMS alerts",
      cta_url: "/sms-paywall",
      icon: "chatbubble-ellipses",
      image_mode: "side",
      image_side: "right",
      image_scale: 0.34,
      background_mode: "gradient",
      bg_dark_from: "#0F2E2E",
      bg_dark_to: "#081A1A",
      bg_light_from: "#0F2E2E",
      bg_light_to: "#134E4A",
      height: 150,
      width_pct: 100,
    },
  },
  {
    id: "boost",
    name: "hustleBoost",
    description: "Sell placement. Warm gold, rocket — deliberately unlike the teal house style.",
    values: {
      kind: "custom",
      eyebrow: "GET SEEN FIRST",
      title: "Put your Skill at the top of the feed",
      subtitle: "hustleBoost lifts you into Featured. From ₦1,500 a week.",
      cta_label: "Boost my Skill",
      cta_url: "/boost-paywall",
      icon: "rocket",
      image_mode: "side",
      image_side: "right",
      image_scale: 0.32,
      background_mode: "gradient",
      bg_dark_from: "#4A2F09",
      bg_dark_to: "#1C1204",
      bg_light_from: "#B45309",
      bg_light_to: "#78350F",
      height: 156,
      width_pct: 100,
    },
  },
  {
    id: "verify",
    name: "Verify identity",
    description: "Trust prompt. Shield, cool blue — reads as security, not marketing.",
    values: {
      kind: "custom",
      eyebrow: "BUILD TRUST",
      title: "Verified Hustlers get hired more",
      subtitle: "One NIN check unlocks withdrawals and in-person work.",
      cta_label: "Verify my identity",
      cta_url: "/verify-identity",
      icon: "shield-checkmark",
      image_mode: "side",
      image_side: "right",
      image_scale: 0.3,
      background_mode: "gradient",
      bg_dark_from: "#12304A",
      bg_dark_to: "#071522",
      bg_light_from: "#1E3A5F",
      bg_light_to: "#0F2942",
      height: 150,
      width_pct: 100,
    },
  },
  {
    id: "featured",
    name: "Boosted right now",
    description: "Shows live hustleBoost placements, reshuffled on a clock. Labelled PROMOTED.",
    values: {
      kind: "featured",
      title: "Boosted right now",
      cta_label: "See all",
      cta_url: "/discover",
      featured_count: 6,
      rotate_minutes: 20,
      image_mode: "none",
      background_mode: "gradient",
      bg_dark_from: "#0F2E2E",
      bg_dark_to: "#081A1A",
      bg_light_from: "#0F2E2E",
      bg_light_to: "#134E4A",
      height: 210,
      width_pct: 100,
    },
  },
  {
    id: "announce",
    name: "Announcement",
    description: "A plain notice. Solid colour, no icon, short — for anything one-off.",
    values: {
      kind: "custom",
      eyebrow: "WHAT'S NEW",
      title: "Something worth telling everyone",
      subtitle: "Keep it to a line. A banner nobody finishes reading is a banner nobody read.",
      cta_label: "Take a look",
      cta_url: "/home",
      icon: "megaphone",
      image_mode: "side",
      image_side: "left",
      image_scale: 0.26,
      background_mode: "solid",
      bg_dark_from: "#1C4A4A",
      bg_dark_to: "#1C4A4A",
      bg_light_from: "#0F2E2E",
      bg_light_to: "#0F2E2E",
      height: 132,
      width_pct: 92,
    },
  },
];
