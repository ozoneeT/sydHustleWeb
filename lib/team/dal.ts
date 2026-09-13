import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { readTeamSession } from "@/lib/team/session";
import { getTeamMember, type TeamMember } from "@/lib/team/data";

/**
 * The team area's authorization boundary. Every page and every server
 * action in /team starts here.
 *
 * There are no permissions to check — a team member can do exactly one thing,
 * which is write up their own work — so the whole question is "is this a
 * live account". Status is re-read from the database on every request
 * rather than trusted from the token, so suspending someone in the console
 * takes effect on their next click.
 */

export const getTeamActor = cache(async (): Promise<TeamMember | null> => {
  const session = await readTeamSession();
  if (!session) return null;

  const member = await getTeamMember(session.vid);
  // Deleted, suspended, or never finished signing up.
  if (!member || member.status !== "active") return null;

  return member;
});

export const requireMember = cache(async (): Promise<TeamMember> => {
  const member = await getTeamActor();
  // Not "/team": a cookie that still verifies but resolves to nobody
  // has to be cleared, and only a route handler may do that.
  if (!member) redirect("/team/signed-out");
  return member;
});
