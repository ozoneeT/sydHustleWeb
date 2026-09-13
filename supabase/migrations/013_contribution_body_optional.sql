-- The write-up becomes optional.
--
-- A title alone is a real entry: "fixed the withdrawal screen crash" on
-- the day it happened is worth more in the ledger than nothing at all,
-- which is what gets recorded when the form insists on a paragraph
-- somebody doesn't have the energy to write at eleven at night.
--
-- It is still the thing that gets a claim approved quickly, and the form
-- says so — recommended, not required.
--
-- Null rather than an empty string, so "no result was written up" is the
-- same shape as every other absent value in this table (`hours`,
-- `credited_hours`, `review_note`) instead of a second way of saying
-- nothing that every reader has to remember to check for.
--
-- Deliberately NOT `alter table if exists`: this must run after
-- 011_team_rename.sql, and failing loudly with "relation does not exist"
-- is far better than quietly doing nothing and leaving the column
-- required.

alter table public.team_contributions
  alter column body drop not null;
