-- A name is something the member tells us, not something we guess.
--
-- Whoever adds someone to the roster has their phone number and often
-- nothing else — a number passed on in a chat, with no agreed spelling of
-- the person behind it. Requiring a name at that point meant inventing
-- one, and an invented name is what ends up printed next to a claim on
-- the day the work is finally paid for.
--
-- So `name` starts null and is filled in by the member themselves when
-- they sign up, at which point it is theirs and correct. Until then the
-- roster identifies the row by its phone number, which is the only thing
-- actually known about it.
--
-- Deliberately NOT `alter table if exists`: this must run after
-- 011_team_rename.sql, and failing loudly with "relation does not exist"
-- is far better than quietly doing nothing and leaving the column
-- required.

alter table public.team_members
  alter column name drop not null;

-- Signup is still the only thing that sets it, and it demands one before
-- it will create an account — see lib/team/signup-actions.ts. So an
-- `active` member always has a name; a null means nobody has claimed that
-- number yet.
