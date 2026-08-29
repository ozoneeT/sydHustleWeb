/**
 * What may be taken away, and what taking it away costs.
 *
 * A plain module, NOT a "use server" one: Next allows a server-action file
 * to export async functions and nothing else, so a shared constant living
 * beside the action would fail the build. The client component needs this
 * list to render, and the action needs it to validate, so it belongs to
 * neither of them.
 */

/**
 * The seven, in the order a moderator thinks about them: what somebody can
 * put out, what they can take on, their money, then how they reach people.
 *
 * `blast` is what the restriction actually costs the person, and it is
 * shown next to each switch. Choosing a sanction without seeing its cost
 * is how a chat problem ends up freezing somebody's earnings.
 */
export const FEATURES = [
  {
    key: "hustle_posting",
    label: "Hustle posting",
    blast: "Cannot post new Hustles. Existing ones keep running.",
  },
  {
    key: "hustle_applying",
    label: "Hustle applying",
    blast: "Cannot apply to Hustles. Work already accepted continues.",
  },
  {
    key: "skill_posting",
    label: "Skill posting",
    blast: "Cannot publish new Skills. Live listings stay up.",
  },
  {
    key: "skill_booking",
    label: "Skill booking",
    blast: "Cannot book a SkilledHustler. Bookings already made continue.",
  },
  {
    key: "withdrawing",
    label: "Withdrawing money",
    blast: "Cannot withdraw. The balance stays theirs and keeps earning.",
  },
  {
    key: "calling",
    label: "Calling",
    blast: "Cannot start a call. Messaging still works.",
  },
  {
    key: "messaging",
    label: "Messaging",
    blast: "Cannot send messages, including in a Hustle already under way.",
  },
] as const;

export type FeatureKey = (typeof FEATURES)[number]["key"];

export type FeatureRestriction = {
  feature: string;
  restricted_until: string | null;
  reason: string;
  created_at: string;
  /**
   * Whether this row is still in force.
   *
   * Decided on the server. "Has it expired" is a question about the clock,
   * and the clock is not something a React render may read - the compiler's
   * purity rule is right to refuse it. The server already knows the time
   * and is the only side whose answer the database would agree with anyway.
   */
  active: boolean;
};
