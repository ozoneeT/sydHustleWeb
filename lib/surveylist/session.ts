import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

/**
 * Sessions for the pre-launch contact list at /surveylist.
 *
 * There is no separate moderator account any more — the survey is collected,
 * the field dashboards are gone, and the one door left uses the same
 * CONSOLE_EMAIL / CONSOLE_PASSWORD as the business console. The cookie is
 * still its own, scoped to /surveylist: a console session and a list session
 * are minted by the same credentials but neither is the other, so a stolen
 * list cookie can't open the books.
 */

const SURVEY_LIST_COOKIE = "sh_surveylist";
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours — it's 361 people's contact details.

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing SESSION_SECRET environment variable.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSurveyListSession() {
  const token = await new SignJWT({ scope: "surveylist" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_MS / 1000}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(SURVEY_LIST_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + SESSION_DURATION_MS),
    sameSite: "lax",
    path: "/surveylist",
  });
}

export async function hasSurveyListSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SURVEY_LIST_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    return payload.scope === "surveylist";
  } catch {
    return false;
  }
}

export async function deleteSurveyListSession() {
  const cookieStore = await cookies();
  cookieStore.delete({ name: SURVEY_LIST_COOKIE, path: "/surveylist" });
}

export { SURVEY_LIST_COOKIE };
