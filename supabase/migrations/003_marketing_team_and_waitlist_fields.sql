-- Adds fields that were being collected on the client but silently dropped
-- before hitting the database:
--   - name/school captured during the survey's "Get early access" step,
--     mirrored into survey_responses so they're preserved even when the
--     waitlist upsert is skipped as a duplicate.
--   - the closing "join the marketing team" question and its conditional
--     WhatsApp number follow-up.

alter table public.survey_responses
  add column if not exists name text,
  add column if not exists school text,
  add column if not exists join_marketing_team text check (join_marketing_team in ('yes', 'no')),
  add column if not exists marketing_whatsapp text;
