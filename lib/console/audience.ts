/**
 * Who a broadcast goes to.
 *
 * One shape, used in three places: the form builds it, the server action
 * validates it, and `console_broadcast_audience(jsonb)` in Postgres
 * resolves it. Keeping the field names identical across all three means
 * the audience the operator previewed is literally the audience the
 * database selects, with nothing translating in between.
 *
 * Every field is optional and absent means "any". They AND together,
 * so an empty object is "everybody", which is what the broadcast page
 * did before it could target at all.
 */

import { z } from "zod";

export type AudienceFilters = {
  /** Named individuals. Still ANDed with the rest, so a contradictory
   * pick previews as 0 rather than quietly overriding a filter. */
  profile_ids?: string[];
  persona?: "hustler" | "provider" | "both" | "unset";
  has_skills?: boolean;
  sms?: "active" | "lapsed" | "none";
  identity?: "verified" | "unverified";
  onboarded?: boolean;
  posted_hustle?: boolean;
  completed_work?: boolean;
  inactive_days?: number;
  active_within_days?: number;
  joined_within_days?: number;
  joined_before_days?: number;
  reachable?: boolean;
  school?: string;
  include_suspended?: boolean;
};

/** Ten years. Anything past it is a typo, not an audience. */
const DAYS = z.coerce.number().int().min(1).max(3650);

export const audienceSchema = z.object({
  profile_ids: z.array(z.string().uuid()).max(500).optional(),
  persona: z.enum(["hustler", "provider", "both", "unset"]).optional(),
  has_skills: z.boolean().optional(),
  sms: z.enum(["active", "lapsed", "none"]).optional(),
  identity: z.enum(["verified", "unverified"]).optional(),
  onboarded: z.boolean().optional(),
  posted_hustle: z.boolean().optional(),
  completed_work: z.boolean().optional(),
  inactive_days: DAYS.optional(),
  active_within_days: DAYS.optional(),
  joined_within_days: DAYS.optional(),
  joined_before_days: DAYS.optional(),
  reachable: z.boolean().optional(),
  school: z.string().trim().min(2).max(80).optional(),
  include_suspended: z.boolean().optional(),
});

export type ChoiceKey =
  | "persona"
  | "has_skills"
  | "sms"
  | "identity"
  | "onboarded"
  | "posted_hustle"
  | "completed_work"
  | "reachable";

export type ChoiceField = {
  key: ChoiceKey;
  label: string;
  hint?: string;
  /** `""` is always first and always means "any". */
  options: { value: string; label: string }[];
};

/**
 * The dropdowns, in the order an operator thinks about them: who they
 * are, what they have set up, what they have done, whether we can
 * actually reach them.
 *
 * This array is the single source of the labels. The summary line under
 * the send button is generated from it too, so a wording change here
 * cannot leave the confirmation describing a different audience than the
 * one selected.
 */
export const CHOICE_FIELDS: ChoiceField[] = [
  {
    key: "persona",
    label: "Persona",
    hint: "Accounts set to Both answer to Hustler and to Provider, the same way every capability gate in the app reads them.",
    options: [
      { value: "", label: "Anyone" },
      { value: "hustler", label: "Hustlers" },
      { value: "provider", label: "Providers" },
      { value: "both", label: "Both, exactly" },
      { value: "unset", label: "Never chose one" },
    ],
  },
  {
    key: "has_skills",
    label: "Skills listed",
    hint: "A live listing. Skills taken down by moderation do not count.",
    options: [
      { value: "", label: "Any" },
      { value: "true", label: "Has a Skill listed" },
      { value: "false", label: "No Skill listed" },
    ],
  },
  {
    key: "sms",
    label: "SMS alerts",
    hint: "Lapsed means they paid once and are not covered now.",
    options: [
      { value: "", label: "Any" },
      { value: "active", label: "Subscribed" },
      { value: "lapsed", label: "Lapsed" },
      { value: "none", label: "Never subscribed" },
    ],
  },
  {
    key: "identity",
    label: "Identity",
    options: [
      { value: "", label: "Any" },
      { value: "verified", label: "NIN verified" },
      { value: "unverified", label: "Not verified" },
    ],
  },
  {
    key: "onboarded",
    label: "Profile setup",
    options: [
      { value: "", label: "Any" },
      { value: "true", label: "Finished the wizard" },
      { value: "false", label: "Never finished it" },
    ],
  },
  {
    key: "posted_hustle",
    label: "Posted a Hustle",
    options: [
      { value: "", label: "Any" },
      { value: "true", label: "Has posted one" },
      { value: "false", label: "Never posted one" },
    ],
  },
  {
    key: "completed_work",
    label: "Completed work",
    hint: "Finished a Hustle as the Hustler, so they have earned here.",
    options: [
      { value: "", label: "Any" },
      { value: "true", label: "Has completed one" },
      { value: "false", label: "Never completed one" },
    ],
  },
  {
    key: "reachable",
    label: "Push reachable",
    hint: "Someone with no device still gets the notification in their in-app list, they just are not buzzed about it.",
    options: [
      { value: "", label: "Any" },
      { value: "true", label: "Has a device" },
      { value: "false", label: "No device registered" },
    ],
  },
];

const BOOLEAN_KEYS: ChoiceKey[] = [
  "has_skills",
  "onboarded",
  "posted_hustle",
  "completed_work",
  "reachable",
];

/** Read a choice field back out as the string its `<select>` carries. */
export function choiceValue(
  filters: AudienceFilters,
  key: ChoiceKey
): string {
  const value = filters[key];
  if (value === undefined) return "";
  return String(value);
}

/** Apply one dropdown change. `""` clears the field back to "any". */
export function withChoice(
  filters: AudienceFilters,
  key: ChoiceKey,
  value: string
): AudienceFilters {
  const next = { ...filters };
  if (value === "") {
    delete next[key];
  } else if (BOOLEAN_KEYS.includes(key)) {
    (next as Record<string, unknown>)[key] = value === "true";
  } else {
    (next as Record<string, unknown>)[key] = value;
  }
  return next;
}

/**
 * The audience in words, for the confirmation line.
 *
 * Built from CHOICE_FIELDS rather than from a second set of strings,
 * because a summary that can disagree with the form is worse than no
 * summary at all: it is the last thing anybody reads before sending.
 */
export function describeAudience(filters: AudienceFilters): string[] {
  const parts: string[] = [];

  if (filters.profile_ids?.length) {
    parts.push(
      filters.profile_ids.length === 1
        ? "1 named person"
        : `${filters.profile_ids.length} named people`
    );
  }

  for (const field of CHOICE_FIELDS) {
    const raw = choiceValue(filters, field.key);
    if (raw === "") continue;
    const option = field.options.find((o) => o.value === raw);
    if (option) parts.push(option.label);
  }

  if (filters.inactive_days) {
    parts.push(`Not opened in ${filters.inactive_days} days`);
  }
  if (filters.active_within_days) {
    parts.push(`Opened in the last ${filters.active_within_days} days`);
  }
  if (filters.joined_within_days) {
    parts.push(`Joined in the last ${filters.joined_within_days} days`);
  }
  if (filters.joined_before_days) {
    parts.push(`Joined over ${filters.joined_before_days} days ago`);
  }
  if (filters.school) parts.push(`School contains "${filters.school}"`);
  if (filters.include_suspended) parts.push("Including suspended accounts");

  return parts.length > 0 ? parts : ["Everyone"];
}
