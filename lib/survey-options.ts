// Shared option lists + human-readable labels for survey questions. Used by
// both the survey wizard (components/SurveyForm.tsx) and the moderator/admin
// dashboards, so responses render with the same wording respondents saw.

export const skillOptions = [
  { value: "project_writing_research", label: "Project writing and research" },
  { value: "private_tutoring", label: "Private course tutoring" },
  { value: "cv_resume_writing", label: "CV and resume writing" },
  { value: "graphic_design", label: "Graphics design" },
  { value: "ui_ux_design", label: "UI/UX design" },
  { value: "phone_repair", label: "Phone repair" },
  { value: "photography", label: "Photography" },
  { value: "video_editing", label: "Video editing" },
  { value: "hair_making", label: "Hair making" },
  { value: "hair_barbing", label: "Hair barbing" },
  { value: "tailoring", label: "Tailor" },
  { value: "fashion_design", label: "Fashion design" },
  { value: "microblading", label: "Microblading" },
  { value: "makeup_artistry", label: "Makeup" },
  { value: "nail_tech", label: "Nail tech" },
  { value: "shoe_making", label: "Shoe making" },
  { value: "solar_inverter_installation", label: "Solar panel and inverter installer" },
  { value: "interior_decoration", label: "Interior decoration" },
  { value: "printing_press", label: "Printing press" },
  { value: "fitness_training", label: "Fitness personal trainer" },
  { value: "cooking_baking", label: "Cooking or baking" },
  { value: "music_dj", label: "Music DJing" },
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
