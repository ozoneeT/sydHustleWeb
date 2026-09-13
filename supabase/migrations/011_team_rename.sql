-- "Volunteer" becomes "team member", everywhere.
--
-- The word was wrong. These are the people building sydHustle, and calling
-- them volunteers framed the work as charity rather than as a stake in
-- something — which is the opposite of what the ledger is for. Nothing
-- about the model changes here: the roster is still the allowlist, a
-- contribution is still a claim until someone approves it, and every row
-- keeps its id.
--
-- Pure renaming. No data is copied, moved between tables, or dropped, so
-- everything already recorded survives with its primary key intact. It
-- touches only `public`; storage is untouched, for the reason set out at
-- the bottom.
--
-- Safe to run twice: every statement checks first, because the most likely
-- second reader of this file is someone who isn't sure whether it has been
-- applied yet.

-- Tables ---------------------------------------------------------------

alter table if exists public.volunteers
  rename to team_members;

alter table if exists public.volunteer_contributions
  rename to team_contributions;

alter table if exists public.volunteer_contribution_media
  rename to team_contribution_media;

-- Columns --------------------------------------------------------------

-- `alter table ... rename column` has no IF EXISTS, so the check is
-- explicit. Renaming the foreign key's column does not disturb the
-- constraint itself — Postgres tracks it by attribute number, not name.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'team_contributions'
      and column_name = 'volunteer_id'
  ) then
    alter table public.team_contributions
      rename column volunteer_id to member_id;
  end if;
end $$;

-- Indexes --------------------------------------------------------------
--
-- Renaming a table leaves its indexes under their old names. They would
-- keep working untouched; this is so that the next person reading
-- `\d team_contributions` isn't told a story about volunteers.

alter index if exists public.volunteers_phone_idx
  rename to team_members_phone_idx;
alter index if exists public.volunteers_status_idx
  rename to team_members_status_idx;
alter index if exists public.volunteer_contributions_volunteer_idx
  rename to team_contributions_member_idx;
alter index if exists public.volunteer_contributions_status_idx
  rename to team_contributions_status_idx;
alter index if exists public.volunteer_contribution_media_contribution_idx
  rename to team_contribution_media_contribution_idx;

-- Storage --------------------------------------------------------------
--
-- NOTHING HERE. Evidence no longer lives in Supabase Storage at all — it
-- moved to Cloudflare R2, where egress is free and the free tier is ten
-- times the size. See lib/team/r2.ts.
--
-- `team_contribution_media.storage_path` now holds an R2 object key
-- (`team/<member id>/<uuid>.<ext>`, in the same bucket as promo artwork)
-- rather than a Supabase object path. The column keeps its name because that is still what it
-- is: a path to an object. Nothing needs converting, because no file was
-- ever uploaded under the old arrangement.
--
-- The `volunteer-contributions` bucket that 010 created is now unused and
-- empty. Supabase refuses `delete from storage.buckets` in SQL — a trigger
-- (storage.protect_delete) raises rather than letting a statement orphan
-- objects it can't see — so remove it by hand if you want it gone:
-- Storage → Buckets → volunteer-contributions → Delete bucket. Leaving it
-- costs nothing but a row in the bucket list.

-- Row level security is a property of the table and follows the rename, so
-- these stay deny-all for anon/authenticated with no policies — read and
-- written only through the service-role client in lib/team/*.
