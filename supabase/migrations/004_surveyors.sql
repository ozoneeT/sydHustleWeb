-- Surveyors ("moderators") who collect survey responses in the field.
--
-- Auth model: no passwords/accounts — each surveyor gets a unique 6-digit
-- PIN when they sign up, and logs into their dashboard with just their name
-- + PIN. Every /survey respondent must also enter a valid surveyor PIN
-- before starting the questionnaire, which links their response back to
-- the surveyor who collected it.
--
-- All reads/writes to this table happen server-side via the service-role
-- Supabase client (see lib/moderator/*), never directly from the browser,
-- so RLS is enabled with no policies (deny-all for anon/authenticated).

create table if not exists public.surveyors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pin text not null unique,
  role text not null default 'surveyor' check (role in ('surveyor', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.surveyors enable row level security;

alter table public.survey_responses
  add column if not exists surveyor_id uuid references public.surveyors(id);

-- After running this migration, seed your own admin account, e.g.:
--   insert into public.surveyors (name, pin, role)
--   values ('Your Name', '482913', 'admin');
