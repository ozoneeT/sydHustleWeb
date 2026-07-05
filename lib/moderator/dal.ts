import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { decryptSession, getSessionCookieValue, type SurveyorRole } from "@/lib/moderator/session";

export const verifySession = cache(async () => {
  const cookieValue = await getSessionCookieValue();
  const session = await decryptSession(cookieValue);

  if (!session) {
    redirect("/moderator/login");
  }

  return { surveyorId: session.surveyorId, role: session.role };
});

/**
 * Same as verifySession, but returns null instead of redirecting. Useful
 * for proxy-adjacent checks or pages that want to branch on auth state
 * without forcing a redirect (e.g. showing a "log in" link vs "dashboard").
 */
export const getOptionalSession = cache(async () => {
  const cookieValue = await getSessionCookieValue();
  return decryptSession(cookieValue);
});

export interface CurrentSurveyor {
  id: string;
  name: string;
  pin: string;
  role: SurveyorRole;
  created_at: string;
}

export const getCurrentSurveyor = cache(async (): Promise<CurrentSurveyor> => {
  const session = await verifySession();
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("surveyors")
    .select("id, name, pin, role, created_at")
    .eq("id", session.surveyorId)
    .single();

  if (error || !data) {
    redirect("/moderator/login");
  }

  return data;
});

export async function requireAdmin() {
  const surveyor = await getCurrentSurveyor();
  if (surveyor.role !== "admin") {
    redirect("/dashboard");
  }
  return surveyor;
}

export async function requireSurveyor() {
  const surveyor = await getCurrentSurveyor();
  if (surveyor.role === "admin") {
    redirect("/admin");
  }
  return surveyor;
}
