import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

/**
 * Team sessions — a third cookie, sharing nothing with the console or
 * the surveyor one but the signing secret.
 *
 * The separation is the point. A team member posts claims about their own
 * work; console staff approve them. One cookie for both would mean a bug
 * in the team sign-in became a way into the books, so `scope` is
 * checked on every read and a token minted here verifies nowhere else.
 *
 * The token carries the member's id and nothing else. Name, status and
 * everything the dashboard shows are re-read from the database on each
 * request, so suspending someone in the console takes effect on their very
 * next click rather than whenever their session happens to expire.
 */

const TEAM_COOKIE = "sh_team";
// Longer than the console's 12 hours: this is somebody writing up work in
// the evening, not somebody looking at money, and being logged out
// mid-write-up is the thing most likely to stop them bothering.
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export interface TeamTokenClaims {
  scope: "team";
  vid: string;
}

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing SESSION_SECRET environment variable.");
  }
  return new TextEncoder().encode(secret);
}

export async function createTeamSession(memberId: string) {
  const token = await new SignJWT({ scope: "team", vid: memberId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_MS / 1000}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(TEAM_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + SESSION_DURATION_MS),
    sameSite: "lax",
    path: "/team",
  });
}

/** Cookie-token check for proxy / edge — no next/headers dependency. */
export async function readTeamToken(
  token: string | undefined
): Promise<TeamTokenClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    if (payload.scope !== "team") return null;
    if (typeof payload.vid !== "string" || !payload.vid) return null;
    return { scope: "team", vid: payload.vid };
  } catch {
    return null;
  }
}

export async function readTeamSession(): Promise<TeamTokenClaims | null> {
  const cookieStore = await cookies();
  return readTeamToken(cookieStore.get(TEAM_COOKIE)?.value);
}

export async function deleteTeamSession() {
  const cookieStore = await cookies();
  cookieStore.delete({ name: TEAM_COOKIE, path: "/team" });
}

export { TEAM_COOKIE };
