-- Asking to be paid.
--
-- The whole arrangement is "work now, share later", and until now the
-- later half existed only as something people were told. A button that is
-- visibly there and visibly not ready yet is a more honest version of that
-- promise than silence: it says the day is coming, names the condition,
-- and leaves no doubt about who decides when it arrives.
--
-- Two pieces, both small.

-- One switch, for everybody.
--
-- Settlement opens when sydHustle starts earning, which is a fact about
-- the company rather than about any one person — so this is a single row,
-- not a column on each member. The `id boolean check (id)` trick is what
-- keeps it single: the only value the primary key will accept is true, so
-- a second row is a constraint violation rather than a quiet duplicate
-- that two screens then disagree about.
create table if not exists public.team_settings (
  id boolean primary key default true check (id),

  -- False until there is money. The member's button reads this, and so
  -- does the action behind it — a button is not a permission.
  settlement_open boolean not null default false,

  updated_at timestamptz not null default now(),
  -- Free text rather than a foreign key: the person who flips this may be
  -- the superadmin, who is an environment variable and not a row anywhere.
  updated_by text
);

-- The row has to exist before anything can read it.
insert into public.team_settings (id) values (true) on conflict (id) do nothing;

alter table public.team_settings enable row level security;

-- And who has asked.
--
-- A timestamp rather than a request table: what an admin needs to see is
-- "this person is waiting", and asking twice does not make two debts. It
-- is cleared from the console once the request has been dealt with, which
-- is what makes the roster badge mean "outstanding" rather than "ever".
alter table public.team_members
  add column if not exists settlement_requested_at timestamptz;
