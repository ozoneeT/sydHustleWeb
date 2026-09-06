-- Console staff, the roles that decide what they can open, and the
-- invitations that let them in.
--
-- The model is deliberately small: a role is a named set of console tabs, a
-- staff member holds one or more roles, and their permissions are the union
-- of those roles' tabs. There are no per-record rules and no allow/deny
-- precedence to reason about — a tab is either in one of your roles or it
-- is not.
--
-- The superadmin is NOT a row here. That account is CONSOLE_EMAIL /
-- CONSOLE_PASSWORD in the environment, so the person who appoints everyone
-- else cannot be locked out, demoted or deleted through the very screen
-- they administer. It also means an empty staff table is a working system.
--
-- Read and written only with the service-role client (lib/console/staff.ts),
-- so RLS is on with no policies — deny-all for anon/authenticated. Password
-- hashes in particular must never be reachable from a browser.

create table if not exists public.console_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,

  -- Tab keys from lib/console/tabs.ts. Text rather than an enum because the
  -- console gains tabs often, and a migration per tab would mean the code
  -- and the database have to deploy in lockstep. Unknown keys are ignored
  -- when permissions are resolved, so a removed tab degrades quietly.
  permissions text[] not null default '{}',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.console_staff (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,

  -- scrypt, as `scrypt$N$r$p$salt$hash` — see lib/console/password.ts.
  -- Null until the invitation is accepted, which is what makes an invited
  -- staff member unable to sign in even if they guess their own email.
  password_hash text,

  status text not null default 'invited'
    check (status in ('invited', 'active', 'suspended')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create index if not exists console_staff_email_idx on public.console_staff (email);

create table if not exists public.console_staff_roles (
  staff_id uuid not null references public.console_staff(id) on delete cascade,
  role_id uuid not null references public.console_roles(id) on delete cascade,
  primary key (staff_id, role_id)
);

-- An invitation is a one-time secret sent to an address. Only its hash is
-- stored: a leaked database backup must not hand anyone a working way into
-- the console.
create table if not exists public.console_invitations (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.console_staff(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists console_invitations_staff_idx
  on public.console_invitations (staff_id, created_at desc);

alter table public.console_roles enable row level security;
alter table public.console_staff enable row level security;
alter table public.console_staff_roles enable row level security;
alter table public.console_invitations enable row level security;

-- A starting point, so the first invitation doesn't have to wait for
-- someone to design a role from nothing. Every one of these is editable and
-- deletable; none of them is special to the code.
insert into public.console_roles (name, description, permissions)
values
  (
    'Finance',
    'The books: earnings, costs, transactions, withdrawals and payment checks.',
    array['overview','earnings','costs','transactions','withdrawals','payments','receipts','transaction-reports']
  ),
  (
    'Support',
    'Day-to-day user contact — accounts, subscriptions and identity checks.',
    array['overview','users','subscribers','identity','certifications']
  ),
  (
    'Trust & Safety',
    'Reports, appeals, moderation and the panic desk.',
    array['overview','reports','appeals','review-appeals','moderation','listings','panic','location']
  ),
  (
    'Growth',
    'Skills, subscriptions, promotions and everything that goes out to users.',
    array['overview','skills','featured','promos','broadcast','campaigns']
  )
on conflict (name) do nothing;
