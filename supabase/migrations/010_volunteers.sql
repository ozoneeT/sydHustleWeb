-- Volunteers, and the ledger of what they built.
--
-- SUPERSEDED BY 011_team_rename.sql, which renames every table and column
-- below: "volunteer" became "team member" throughout. This file is left
-- exactly as it was applied, because a migration that has already run is a
-- record of what happened rather than a description of the schema. Read
-- 011 for the current names.
--
-- sydHustle is being built by people working unpaid on the promise of a
-- share once the platform earns. That promise is only worth something if
-- there is a record of who did what, agreed at the time rather than
-- reconstructed from memory two years later. These three tables are that
-- record.
--
-- Two rules shape the whole design:
--
--  1. Nobody signs themselves up. An admin puts a phone number on the
--     roster first; signup finds that row or it fails. The roster IS the
--     allowlist — there is no second table to keep in step, and a number
--     that was never added has nothing to attach a password to.
--
--  2. Nothing counts until it is approved. A contribution is posted by the
--     volunteer as a claim and stays `pending` until someone in the console
--     agrees. Credited hours are set by the reviewer, not the claimant.
--
-- Read and written only with the service-role client (lib/volunteers/*),
-- so RLS is on with no policies — deny-all for anon/authenticated, same as
-- the console tables. Password hashes must never be reachable from a
-- browser.

create table if not exists public.volunteers (
  id uuid primary key default gen_random_uuid(),

  -- E.164, normalised before it is written or looked up — see
  -- lib/volunteers/phone.ts. Storing one canonical shape is what makes the
  -- allowlist check work: the admin types 0803…, the volunteer types
  -- +234803…, and both land on the same row.
  phone text not null unique,

  name text not null,

  -- scrypt, as `scrypt$N$r$p$salt$hash` — see lib/console/password.ts.
  -- Null until they sign up, which is what stops a number that is merely
  -- on the roster from being an account anyone can use.
  password_hash text,

  status text not null default 'invited'
    check (status in ('invited', 'active', 'suspended')),

  -- Free text for whoever adds the number: "Tobi, backend", "designer
  -- Emeka's friend". Purely so the roster is recognisable months later.
  note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create index if not exists volunteers_phone_idx on public.volunteers (phone);
create index if not exists volunteers_status_idx on public.volunteers (status);

create table if not exists public.volunteer_contributions (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references public.volunteers(id) on delete cascade,

  title text not null,
  body text not null,

  -- Kept as text rather than an enum: the kinds of work change as the
  -- product does, and a migration per category is not worth it. Unknown
  -- values render as themselves.
  category text not null default 'other',

  -- The day the work happened, which is not the day it was posted —
  -- people write up a week at a time.
  occurred_on date not null default current_date,

  -- What the volunteer says it took. A claim, like the rest of the row.
  hours numeric(6, 2),

  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),

  -- What the reviewer agreed to. Separate from `hours` on purpose: the
  -- claim and the decision are different facts, and keeping both means a
  -- disagreement is visible instead of overwritten.
  credited_hours numeric(6, 2),

  review_note text,
  reviewed_at timestamptz,
  -- Free text rather than a foreign key: the reviewer may be the
  -- superadmin, who is an environment variable and not a row anywhere.
  reviewed_by text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists volunteer_contributions_volunteer_idx
  on public.volunteer_contributions (volunteer_id, created_at desc);

-- The review queue's own index: pending first, oldest first, so nobody's
-- entry sits at the bottom of a list forever.
create index if not exists volunteer_contributions_status_idx
  on public.volunteer_contributions (status, created_at);

-- Screenshots, screen recordings, design exports, receipts. Rows here are
-- written only after the file is in the bucket, so a row always points at
-- something real.
create table if not exists public.volunteer_contribution_media (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null
    references public.volunteer_contributions(id) on delete cascade,

  -- Path inside the private `volunteer-contributions` bucket, always
  -- prefixed with the volunteer's id. The prefix is checked on write, so a
  -- volunteer cannot attach someone else's file to their own claim.
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null,
  created_at timestamptz not null default now()
);

create index if not exists volunteer_contribution_media_contribution_idx
  on public.volunteer_contribution_media (contribution_id, created_at);

alter table public.volunteers enable row level security;
alter table public.volunteer_contributions enable row level security;
alter table public.volunteer_contribution_media enable row level security;

-- Private. Evidence is read in the console through short-lived signed
-- URLs, the same way certification documents and appeal evidence are.
insert into storage.buckets (id, name, public)
values ('volunteer-contributions', 'volunteer-contributions', false)
on conflict (id) do nothing;
