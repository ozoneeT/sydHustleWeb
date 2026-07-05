// Shared option lists + human-readable labels for survey questions. Used by
// both the survey wizard (components/SurveyForm.tsx) and the moderator/admin
// dashboards, so responses render with the same wording respondents saw.

export const skillOptions = [
  { value: "graphic_design", label: "Graphic design" },
  { value: "writing", label: "Writing / copywriting" },
  { value: "video_editing", label: "Video editing" },
  { value: "web_dev", label: "Web or app development" },
  { value: "social_media", label: "Social media management" },
  { value: "photography", label: "Photography" },
  { value: "tutoring", label: "Tutoring a specific subject" },
  { value: "public_speaking", label: "Public speaking / hosting (MC)" },
  { value: "music_dj", label: "Music or DJing" },
  { value: "fashion_design", label: "Fashion design / tailoring" },
  { value: "makeup_artistry", label: "Makeup artistry" },
  { value: "hair_styling", label: "Hair styling" },
  { value: "cooking_baking", label: "Cooking or baking" },
  { value: "event_planning", label: "Event planning" },
  { value: "sales_marketing", label: "Sales or marketing" },
  { value: "accounting", label: "Accounting or bookkeeping" },
  { value: "translation", label: "Language translation" },
  { value: "fitness_coaching", label: "Fitness training or coaching" },
] as const;

export const uninstallOptions = [
  { value: "poor_quality", label: "Poor quality of hustlers or help received" },
  { value: "payment_issues", label: "Payment issues or getting scammed" },
  { value: "hard_to_find", label: "Difficult to find tasks or hustlers nearby" },
  { value: "high_fees", label: "Fees or commission feel too high" },
  { value: "buggy_app", label: "App is buggy or hard to use" },
  { value: "safety_concerns", label: "Safety or trust concerns" },
  { value: "low_activity", label: "Not enough tasks or hustlers in my area" },
] as const;

export const concernOptions = [
  { value: "meeting_strangers", label: "Meeting or working with strangers" },
  { value: "getting_scammed", label: "Not getting paid or being scammed" },
  { value: "quality_of_service", label: "Quality of the service or help received" },
  { value: "privacy", label: "Privacy of my personal information" },
  { value: "reliability", label: "Reliability of hustlers or task posters" },
  { value: "payment_security", label: "Security of in-app payments" },
] as const;

export const trustFactorOptions = [
  { value: "verified_profiles", label: "Verified student profiles" },
  { value: "ratings_reviews", label: "Ratings and reviews from other students" },
  { value: "secure_payments", label: "Secure in-app payments" },
  { value: "id_verification", label: "ID verification" },
  { value: "dispute_support", label: "Dispute resolution / customer support" },
  { value: "community_reporting", label: "Community reporting of bad actors" },
] as const;

export function labelFor(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string
) {
  return options.find((o) => o.value === value)?.label ?? value;
}

export function labelsFor(
  options: ReadonlyArray<{ value: string; label: string }>,
  values: readonly string[]
) {
  return values.map((v) => labelFor(options, v));
}

export const yesNoLabels: Record<string, string> = {
  yes: "Yes",
  no: "No",
  maybe: "Maybe",
  depends: "Depends on the task",
};

export const hustleFrequencyLabels: Record<string, string> = {
  daily: "Daily",
  few_times_week: "A few times a week",
  weekly: "Weekly",
  few_times_month: "A few times a month",
  occasionally: "Occasionally, when available",
};

export const appUsageRoleLabels: Record<string, string> = {
  providing_hustles: "Providing Hustles (finding help)",
  hustling_the_hustles: "Hustling the Hustles (offering services)",
  both: "Both",
};

export const paymentPreferenceLabels: Record<string, string> = {
  direct_with_client: "Directly with the client",
  sydhustle_dashboard: "Through the sydHustle dashboard",
  no_preference: "No preference",
};

export function label(map: Record<string, string>, value: string | null | undefined) {
  if (!value) return "—";
  return map[value] ?? value;
}
