-- The survey now asks "would you like to join the waitlist?" as its own
-- closing question, instead of always collecting email/name/school. Only
-- respondents who say "yes" go on to provide contact details.

alter table public.survey_responses
  add column if not exists join_waitlist text check (join_waitlist in ('yes', 'no'));
