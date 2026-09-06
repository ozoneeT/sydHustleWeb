import "server-only";

import type { FullResponse, SurveyorWithCount } from "@/lib/survey/data";
import { appUsageRoleLabels, label } from "@/lib/survey-options";

/**
 * One person we can actually reach before launch.
 *
 * The survey table answers a research question; this answers an outreach one
 * — who is this, where do we write to them, and what did they say they'd use
 * the app for. Every response becomes a row even when it carries no contact
 * details, because the count is the honest one: 361 responses, and the gaps
 * are visible rather than quietly filtered away.
 */
export interface SurveyContact {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  school: string | null;
  primaryUse: string;
  /** The same answer in one word, for a table column. */
  primaryUseShort: string;
  primaryUseValue: string;
  joinMarketing: string | null;
  joinWaitlist: string | null;
  wouldUseApp: string | null;
  submittedAt: string | null;
  collectedBy: string | null;
  /** This contact also collected responses in the field. */
  moderator: boolean;
  moderatorRole: string | null;
  responsesCollected: number;
  /** A moderator we hold no survey response for — name only. */
  moderatorOnly: boolean;
  /** Their email appears on more than one response. */
  duplicateEmail: boolean;
}

/** Brand words, not survey words: a Provider posts Hustles, a Hustler does them. */
const PRIMARY_USE_SHORT: Record<string, string> = {
  providing_hustles: "Provider",
  hustling_the_hustles: "Hustler",
  both: "Both",
};

function clean(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? null : trimmed;
}

function normalizeName(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/** Blank names sort last; everything else A–Z, case- and accent-insensitive. */
function byName(a: SurveyContact, b: SurveyContact): number {
  if (!a.name && !b.name) return 0;
  if (!a.name) return 1;
  if (!b.name) return -1;
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

export function buildContacts(
  responses: FullResponse[],
  surveyors: SurveyorWithCount[]
): SurveyContact[] {
  const surveyorNames = new Map(surveyors.map((s) => [s.id, s.name]));

  const emailCounts = new Map<string, number>();
  for (const r of responses) {
    const email = clean(r.email)?.toLowerCase();
    if (!email) continue;
    emailCounts.set(email, (emailCounts.get(email) ?? 0) + 1);
  }

  const contacts: SurveyContact[] = responses.map((r) => {
    const email = clean(r.email);
    return {
      id: r.id,
      name: clean(r.name),
      email,
      phone: clean(r.marketing_whatsapp),
      school: clean(r.school),
      primaryUse: label(appUsageRoleLabels, r.app_usage_role),
      primaryUseShort: PRIMARY_USE_SHORT[r.app_usage_role] ?? r.app_usage_role,
      primaryUseValue: r.app_usage_role,
      joinMarketing: r.join_marketing_team,
      joinWaitlist: r.join_waitlist,
      wouldUseApp: r.would_use_app,
      submittedAt: r.created_at,
      collectedBy: r.surveyor_id ? surveyorNames.get(r.surveyor_id) ?? null : null,
      moderator: false,
      moderatorRole: null,
      responsesCollected: 0,
      moderatorOnly: false,
      duplicateEmail: email ? (emailCounts.get(email.toLowerCase()) ?? 0) > 1 : false,
    };
  });

  // Moderators are contacts too — they're the students who already worked for
  // us. Where one of them also filled the survey we badge their own row
  // rather than listing them twice; the rest come in name-only, because the
  // surveyors table never asked them for an email.
  const byNormalizedName = new Map<string, SurveyContact>();
  for (const c of contacts) {
    const key = normalizeName(c.name);
    if (!key) continue;
    // Prefer the row that actually carries contact details.
    const existing = byNormalizedName.get(key);
    if (!existing || (!existing.email && c.email)) byNormalizedName.set(key, c);
  }

  for (const s of surveyors) {
    const match = byNormalizedName.get(normalizeName(s.name));
    if (match) {
      match.moderator = true;
      match.moderatorRole = s.role;
      match.responsesCollected += s.responseCount;
      continue;
    }

    contacts.push({
      id: `surveyor:${s.id}`,
      name: s.name,
      email: null,
      phone: null,
      school: null,
      primaryUse: "—",
      primaryUseShort: "—",
      primaryUseValue: "",
      joinMarketing: null,
      joinWaitlist: null,
      wouldUseApp: null,
      submittedAt: s.created_at,
      collectedBy: null,
      moderator: true,
      moderatorRole: s.role,
      responsesCollected: s.responseCount,
      moderatorOnly: true,
      duplicateEmail: false,
    });
  }

  return contacts.sort(byName);
}
