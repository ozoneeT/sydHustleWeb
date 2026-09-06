-- Email marketing: campaigns, per-recipient delivery records, and the
-- suppression list that outranks both.
--
-- Everything here is written and read server-side with the service-role
-- client (see lib/email/* and lib/console/campaign-*.ts), never from the
-- browser, so RLS is on with no policies — deny-all for anon/authenticated.

create table if not exists public.email_campaigns (
  id uuid primary key default gen_random_uuid(),

  -- What the operator calls it internally, vs. what the reader sees.
  name text not null,
  subject text not null,
  preheader text,

  -- The template's slots. `body` is plain text; blank lines separate
  -- paragraphs. Storing the slots rather than rendered HTML means a fix to
  -- the template reaches every campaign that hasn't been sent yet, and a
  -- sent campaign can still be re-rendered exactly as it went out.
  heading text,
  body text not null,
  cta_label text,
  cta_url text,
  image_url text,
  footer_note text,

  -- {source, school} — see lib/email/audience.ts. The audience is resolved
  -- once, at send time, into email_campaign_recipients; this column records
  -- what was asked for.
  audience jsonb not null default '{}'::jsonb,

  status text not null default 'draft'
    check (status in ('draft', 'sending', 'paused', 'sent', 'failed')),

  total_recipients integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists email_campaigns_created_idx
  on public.email_campaigns (created_at desc);

-- One row per person per campaign: who it went to, what Resend said, and
-- what happened to it afterwards. This is also the send queue — a campaign
-- is sent by repeatedly claiming the 'pending' rows, so an interrupted send
-- resumes instead of starting over, and nobody is ever mailed twice.
create table if not exists public.email_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.email_campaigns(id) on delete cascade,

  email text not null,
  name text,

  status text not null default 'pending'
    check (status in (
      'pending', 'sent', 'failed',
      'delivered', 'opened', 'clicked', 'bounced', 'complained'
    )),

  -- Resend's id for the message, so a delivery event can be matched back.
  resend_id text,
  error text,

  sent_at timestamptz,
  updated_at timestamptz not null default now(),

  unique (campaign_id, email)
);

create index if not exists email_campaign_recipients_queue_idx
  on public.email_campaign_recipients (campaign_id, status);

create index if not exists email_campaign_recipients_resend_idx
  on public.email_campaign_recipients (resend_id);

-- The suppression list. Checked when an audience is resolved AND again for
-- every batch as it goes out, because a send can run for minutes and an
-- unsubscribe that lands mid-send has to take effect in this campaign, not
-- the next one.
create table if not exists public.email_unsubscribes (
  email text primary key,
  reason text not null default 'user'
    check (reason in ('user', 'bounced', 'complained', 'manual')),
  campaign_id uuid references public.email_campaigns(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.email_campaigns enable row level security;
alter table public.email_campaign_recipients enable row level security;
alter table public.email_unsubscribes enable row level security;
