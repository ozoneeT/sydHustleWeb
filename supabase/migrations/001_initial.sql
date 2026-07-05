-- SydHustle initial schema: waitlist + survey responses

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  school text,
  source text not null default 'landing',
  created_at timestamptz not null default now()
);

create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  is_student text not null,
  has_side_hustle text not null,
  hustle_types jsonb not null default '[]'::jsonb,
  hustle_other text,
  hours_per_week text,
  challenges jsonb not null default '[]'::jsonb,
  challenge_other text,
  desired_features jsonb not null default '[]'::jsonb,
  interest_score smallint not null check (interest_score between 1 and 5),
  would_use text not null,
  would_pay text not null,
  trust_factors text,
  email text,
  additional_feedback text,
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;
alter table public.survey_responses enable row level security;

create policy "Allow anonymous insert on waitlist"
  on public.waitlist
  for insert
  to anon, authenticated
  with check (true);

create policy "Allow anonymous insert on survey_responses"
  on public.survey_responses
  for insert
  to anon, authenticated
  with check (true);
