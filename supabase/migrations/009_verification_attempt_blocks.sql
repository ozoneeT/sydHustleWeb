-- The console's identity page reads a queue of accounts the daily
-- verification cap is currently counting against. The view it reads was
-- never created, so `listVerificationBlocks` threw PGRST205 and took the
-- whole page down with it -- including the retained-records list and the
-- disclosure log, which are the parts this page exists to provide.
--
-- Shape is fixed by lib/console/identity.ts:
--   profile_id, kind, strikes, cap, blocked, last_attempt_at, display_name
--
-- Rules, matching what the app's KYC gates enforce and what the page
-- tells the operator:
--   * only failures count, and only in the last 24 hours
--   * a waived failure is skipped -- `grant_verification_attempts`
--     stamps waived_at rather than deleting the row, so the audit keeps
--     the attempt while the tally forgets it
--   * three strikes on NIN, five on BVN
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
  p.full_name                                            as display_name
from public.identity_verifications v
left join public.profiles p on p.id = v.profile_id
where v.status = 'failed'
  and v.waived_at is null
  and v.created_at > now() - interval '24 hours'
group by v.profile_id, v.id_type, p.full_name;

comment on view public.verification_attempt_blocks is
  'Accounts the daily KYC cap is counting against right now. Failures in '
  'the last 24h, waived ones excluded. Read by the console identity page.';

-- Identity data. The console reaches this with the service role; nothing
-- signed in through the app has any business reading it.
revoke all on public.verification_attempt_blocks from anon, authenticated;
grant select on public.verification_attempt_blocks to service_role;
