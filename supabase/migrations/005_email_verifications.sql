-- Short-lived one-time codes used to confirm a survey respondent actually
-- owns the email address they entered. Rows are written/read only from
-- server actions using the service-role client (see lib/email/*), never
-- directly from the browser, so RLS is enabled with no policies.

create table if not exists public.email_verifications (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  verified boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists email_verifications_email_idx
  on public.email_verifications (email, created_at desc);

alter table public.email_verifications enable row level security;

-- Optional housekeeping: periodically prune old rows, e.g. via a Supabase
-- cron job or manually:
--   delete from public.email_verifications where created_at < now() - interval '7 days';
