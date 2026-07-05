import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SurveyorRole } from "@/lib/moderator/session";

export interface ResponseSummary {
  id: string;
  created_at: string;
  name: string | null;
  school: string | null;
  email: string | null;
  is_student: string | null;
  app_usage_role: string | null;
  would_use_app: string | null;
  needs_extra_income: string | null;
  join_marketing_team: string | null;
  surveyor_id: string | null;
}

const SUMMARY_COLUMNS =
  "id, created_at, name, school, email, is_student, app_usage_role, would_use_app, needs_extra_income, join_marketing_team, surveyor_id";

export async function getResponsesForSurveyor(
  surveyorId: string
): Promise<ResponseSummary[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("survey_responses")
    .select(SUMMARY_COLUMNS)
    .eq("surveyor_id", surveyorId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("failed to fetch surveyor responses:", error);
    return [];
  }

  return data ?? [];
}

export interface SurveyorWithCount {
  id: string;
  name: string;
  pin: string;
  role: SurveyorRole;
  created_at: string;
  responseCount: number;
}

export async function getAllSurveyorsWithCounts(): Promise<SurveyorWithCount[]> {
  const supabase = createServerSupabaseClient();
  const { data: surveyors, error } = await supabase
    .from("surveyors")
    .select("id, name, pin, role, created_at")
    .order("created_at", { ascending: true });

  if (error || !surveyors) {
    console.error("failed to fetch surveyors:", error);
    return [];
  }

  const { data: responses, error: responsesError } = await supabase
    .from("survey_responses")
    .select("surveyor_id");

  if (responsesError) {
    console.error("failed to fetch response counts:", responsesError);
  }

  const counts = new Map<string, number>();
  for (const row of responses ?? []) {
    if (!row.surveyor_id) continue;
    counts.set(row.surveyor_id, (counts.get(row.surveyor_id) ?? 0) + 1);
  }

  return surveyors.map((s) => ({
    ...s,
    responseCount: counts.get(s.id) ?? 0,
  }));
}

export async function getAllResponses(): Promise<ResponseSummary[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("survey_responses")
    .select(SUMMARY_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("failed to fetch all responses:", error);
    return [];
  }

  return data ?? [];
}
