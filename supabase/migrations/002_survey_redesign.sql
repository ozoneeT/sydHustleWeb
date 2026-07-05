-- sydHustle survey redesign: branching questionnaire that segments
-- respondents into hustlers (service providers), task posters, or both.
-- Replaces the original single-track survey_responses table.

drop table if exists public.survey_responses;

create table public.survey_responses (
  id uuid primary key default gen_random_uuid(),

  -- Screening
  is_student text not null check (is_student in ('yes', 'no')),
  needs_extra_income text not null check (needs_extra_income in ('yes', 'no')),

  -- Hustler track (asked when needs_extra_income = 'yes')
  wants_side_hustle text check (wants_side_hustle in ('yes', 'no')),
  hustle_frequency text check (
    hustle_frequency in ('daily', 'few_times_week', 'weekly', 'few_times_month', 'occasionally')
  ),
  hours_per_day smallint check (hours_per_day between 0 and 24),
  has_skill text check (has_skill in ('yes', 'no')),
  skills jsonb not null default '[]'::jsonb,
  skills_other text,
  willing_different_hustle text check (willing_different_hustle in ('yes', 'no')),
  hustle_capability jsonb not null default '{}'::jsonb,

  -- Task poster track (asked when needs_extra_income = 'no')
  needs_task_help text check (needs_task_help in ('yes', 'no')),
  task_help_types jsonb not null default '[]'::jsonb,
  task_help_other text,

  -- Shared / general questions
  would_use_app text not null check (would_use_app in ('yes', 'maybe', 'no')),
  embarrassed_with_mate text not null check (embarrassed_with_mate in ('yes', 'no', 'depends')),
  app_usage_role text not null check (
    app_usage_role in ('providing_hustles', 'hustling_the_hustles', 'both')
  ),
  uninstall_reasons jsonb not null default '[]'::jsonb,
  uninstall_other text,
  concerns jsonb not null default '[]'::jsonb,
  concerns_other text,
  trust_factors jsonb not null default '[]'::jsonb,
  trust_factors_other text,
  payment_preference text not null check (
    payment_preference in ('direct_with_client', 'sydhustle_dashboard', 'no_preference')
  ),
  commission_willingness text not null check (commission_willingness in ('yes', 'no', 'maybe')),

  -- Follow-up
  email text,
  additional_feedback text,

  created_at timestamptz not null default now()
);

alter table public.survey_responses enable row level security;

create policy "Allow anonymous insert on survey_responses"
  on public.survey_responses
  for insert
  to anon, authenticated
  with check (true);
