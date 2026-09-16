-- The queue said WHO was stuck and never WHY.
--
-- The page already tells the operator these refusals go "mostly to people
-- whose NIMC record is missing a field, not to anyone dishonest" -- a
-- claim the page had no way to show, and which nobody could check. The
-- per-factor result was sitting in identity_verifications.match_summary
-- all along, so this carries the latest attempt's copy onto the queue row.
--
-- Note the four states, which the UI must not collapse into two:
--   {"firstname": true}   matched
--   {"firstname": false}  compared, and wrong
--   {"state": null}       NOT compared -- the rail cannot check states, or
--                         this NIMC record carries none. This is the state
--                         the sentence above is about, and reading it as a
--                         failure is how that bug got written the first time.
--   whole column null     not recorded. Failures did not store a summary
--                         until 2026-09-16; every attempt before that is
--                         blank and no amount of looking will fill it in.
--
-- `create or replace` can only append columns, which is all this does.
create or replace view public.verification_attempt_blocks
with (security_invoker = true) as
select
  v.profile_id,
  v.id_type::text                                        as kind,
  count(*)::int                                          as strikes,
  (case when v.id_type::text = 'bvn' then 5 else 3 end)  as cap,
  count(*) >= (case when v.id_type::text = 'bvn' then 5 else 3 end)
                                                         as blocked,
  max(v.created_at)                                      as last_attempt_at,
  p.full_name                                            as display_name,
  -- The newest attempt in this group, not the newest one that happens to
  -- have a summary. Pulling a two-hour-old breakdown forward under a
  -- timestamp that says "just now" would be a worse answer than blank.
  (array_agg(v.match_summary order by v.created_at desc))[1]
                                                         as last_match_summary
from public.identity_verifications v
left join public.profiles p on p.id = v.profile_id
where v.status = 'failed'
  and v.waived_at is null
  and v.created_at > now() - interval '24 hours'
group by v.profile_id, v.id_type, p.full_name;

comment on view public.verification_attempt_blocks is
  'Accounts the daily KYC cap is counting against right now. Failures in '
  'the last 24h, waived ones excluded, with the latest attempt''s per-field '
  'match result. Read by the console identity page.';

revoke all on public.verification_attempt_blocks from anon, authenticated;
grant select on public.verification_attempt_blocks to service_role;
