import { z } from "zod";

/**
 * The audience's shape and vocabulary, kept apart from the queries that
 * resolve it (lib/email/audience.ts) so the composer can import the same
 * option list and the same schema without dragging a service-role Supabase
 * client into the browser bundle.
 */

export const AUDIENCE_SOURCES = [
  {
    value: "all",
    label: "Everyone",
    hint: "Survey respondents and waitlist signups",
  },
  {
    value: "waitlist",
    label: "Waitlist only",
    hint: "Asked to hear about launch",
  },
  {
    value: "survey",
    label: "Survey respondents",
    hint: "Left an email on the survey",
  },
  {
    value: "marketing_team",
    label: "Marketing team",
    hint: "Said yes to helping spread the word",
  },
] as const;

export type AudienceSource = (typeof AUDIENCE_SOURCES)[number]["value"];

export const audienceSchema = z.object({
  source: z.enum(["all", "waitlist", "survey", "marketing_team"]).default("all"),
  /** Case-insensitive substring — "eksu" catches "EKSU" and "Eksu". */
  school: z.string().trim().max(80).optional().or(z.literal("")),
});

export type EmailAudience = z.infer<typeof audienceSchema>;

export function describeAudience(audience: EmailAudience): string {
  const source =
    AUDIENCE_SOURCES.find((s) => s.value === audience.source)?.label ?? "Everyone";
  return audience.school ? `${source} · school matches “${audience.school}”` : source;
}
