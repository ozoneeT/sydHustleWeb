alter table public.email_campaigns
  add column logo_size integer default 150,
  add column banner_size integer default 600;
