import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SurveyorRole } from "@/lib/moderator/session";

export interface FullResponse {
  id: string;
  created_at: string;

  is_student: string;
  needs_extra_income: string;

  wants_side_hustle: string | null;
  hustle_frequency: string | null;
  hours_per_day: number | null;
  has_skill: string | null;
  skills: string[];
  skills_other: string | null;
  willing_different_hustle: string | null;
  hustle_capability: Record<string, "can_do" | "cannot_do">;

  needs_task_help: string | null;
  task_help_types: string[];
  task_help_other: string | null;

  would_use_app: string;
  embarrassed_with_mate: string;
  app_usage_role: string;
  uninstall_reasons: string[];
  uninstall_other: string | null;
  concerns: string[];
  concerns_other: string | null;
  trust_factors: string[];
  trust_factors_other: string | null;
  payment_preference: string;
  commission_willingness: string;

  join_waitlist: string | null;
  email: string | null;
  name: string | null;
  school: string | null;
  additional_feedback: string | null;

  join_marketing_team: string | null;
  marketing_whatsapp: string | null;

  surveyor_id: string | null;
}

const FULL_COLUMNS = `
  id, created_at,
  is_student, needs_extra_income,
  wants_side_hustle, hustle_frequency, hours_per_day, has_skill, skills, skills_other,
  willing_different_hustle, hustle_capability,
  needs_task_help, task_help_types, task_help_other,
  would_use_app, embarrassed_with_mate, app_usage_role,
  uninstall_reasons, uninstall_other, concerns, concerns_other, trust_factors, trust_factors_other,
  payment_preference, commission_willingness,
  join_waitlist, email, name, school, additional_feedback,
  join_marketing_team, marketing_whatsapp,
  surveyor_id
`;

export async function getResponsesForSurveyor(
  surveyorId: string
): Promise<FullResponse[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("survey_responses")
    .select(FULL_COLUMNS)
    .eq("surveyor_id", surveyorId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("failed to fetch surveyor responses:", error);
    return [];
  }

  return (data as unknown as FullResponse[]) ?? [];
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

export async function getAllResponses(): Promise<FullResponse[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("survey_responses")
    .select(FULL_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("failed to fetch all responses:", error);
    return [];
  }

  return (data as unknown as FullResponse[]) ?? [];
}
