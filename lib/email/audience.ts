import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { EmailAudience } from "@/lib/email/audience-options";

export {
  AUDIENCE_SOURCES,
  audienceSchema,
  describeAudience,
  type AudienceSource,
  type EmailAudience,
} from "@/lib/email/audience-options";

/**
 * Who a campaign goes to.
 *
 * The pool is the pre-launch list and only the pre-launch list: people who
 * answered the survey or joined the waitlist. App users in `profiles` are
 * deliberately not reachable from here — they signed up for an account,
 * not for marketing mail, and until there is an opt-in that says otherwise
 * this tool cannot mail them by accident.
 */

export interface AudienceMember {
  email: string;
  name: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalize(value: string | null | undefined): string | null {
  const email = (value ?? "").trim().toLowerCase();
  return EMAIL_RE.test(email) ? email : null;
}

/** Everyone who has ever asked not to hear from us again. */
export async function loadSuppressed(): Promise<Set<string>> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("email_unsubscribes").select("email");

  if (error) {
    // A suppression list we can't read is not an empty one. Callers treat a
    // throw as "don't send", which is the only safe way to be wrong here.
    console.error("failed to load the suppression list:", error);
    throw new Error("Could not read the unsubscribe list — nothing was sent.");
  }

  return new Set((data ?? []).map((row) => row.email.toLowerCase()));
}

/**
 * Resolves an audience into a de-duplicated list of people.
 *
 * Both tables are read because neither is complete on its own: the
 * waitlist has landing-page signups who never took the survey, and the
 * survey has respondents who left an address without joining the waitlist.
 * Where an address appears in both, the one carrying a name wins — a
 * greeting is worth more than a row order.
 */
export async function resolveAudience(
  audience: EmailAudience
): Promise<AudienceMember[]> {
  const supabase = createServerSupabaseClient();
  const school = audience.school?.trim();
  const people = new Map<string, AudienceMember>();

  function add(rawEmail: string | null, rawName: string | null) {
    const email = normalize(rawEmail);
    if (!email) return;
    const name = (rawName ?? "").trim() || null;
    const existing = people.get(email);
    if (existing) {
      if (!existing.name && name) existing.name = name;
      return;
    }
    people.set(email, { email, name });
  }

  const wantsWaitlist = audience.source === "all" || audience.source === "waitlist";
  const wantsSurvey =
    audience.source === "all" ||
    audience.source === "survey" ||
    audience.source === "marketing_team";

  if (wantsWaitlist) {
    let query = supabase.from("waitlist").select("email, name, school");
    if (school) query = query.ilike("school", `%${school}%`);
    const { data, error } = await query;
    if (error) {
      console.error("failed to read the waitlist:", error);
      throw new Error("Could not read the waitlist.");
    }
    for (const row of data ?? []) add(row.email, row.name);
  }

  if (wantsSurvey) {
    let query = supabase
      .from("survey_responses")
      .select("email, name, school, join_marketing_team")
      .not("email", "is", null);

    if (school) query = query.ilike("school", `%${school}%`);
    if (audience.source === "marketing_team") {
      query = query.eq("join_marketing_team", "yes");
    }

    const { data, error } = await query;
    if (error) {
      console.error("failed to read survey responses:", error);
      throw new Error("Could not read the survey responses.");
    }
    for (const row of data ?? []) add(row.email, row.name);
  }

  const suppressed = await loadSuppressed();
  for (const email of suppressed) people.delete(email);

  return [...people.values()].sort((a, b) => a.email.localeCompare(b.email));
}

export interface AudiencePreview {
  count: number;
  named: number;
  suppressed: number;
  sample: string[];
}

/** What the composer shows before anyone commits to a send. */
export async function previewAudience(
  audience: EmailAudience
): Promise<AudiencePreview> {
  const [members, suppressed] = await Promise.all([
    resolveAudience(audience),
    loadSuppressed(),
  ]);

  return {
    count: members.length,
    named: members.filter((m) => m.name).length,
    suppressed: suppressed.size,
    sample: members.slice(0, 5).map((m) => m.email),
  };
}
