# sydHustle

Landing page and student validation survey for [sydhustle.com](https://sydhustle.com).

Built with Next.js, Tailwind CSS, and Supabase.

## Local development

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up Supabase**

   - Create a project at [supabase.com](https://supabase.com)
   - Open the SQL Editor and run the migrations in order: [`001_initial.sql`](supabase/migrations/001_initial.sql), [`002_survey_redesign.sql`](supabase/migrations/002_survey_redesign.sql), [`003_marketing_team_and_waitlist_fields.sql`](supabase/migrations/003_marketing_team_and_waitlist_fields.sql), [`004_surveyors.sql`](supabase/migrations/004_surveyors.sql), [`005_email_verifications.sql`](supabase/migrations/005_email_verifications.sql), [`006_join_waitlist_question.sql`](supabase/migrations/006_join_waitlist_question.sql), [`007_email_campaigns.sql`](supabase/migrations/007_email_campaigns.sql), then [`008_console_rbac.sql`](supabase/migrations/008_console_rbac.sql)
   - Copy your project URL, anon key, and service role key from **Project Settings → API**
   - **Seed a moderator PIN** — `/survey` won't start without one. Run this in the SQL editor with a name and a PIN you choose (the survey list itself is opened with `CONSOLE_EMAIL` / `CONSOLE_PASSWORD`, not a PIN):
     ```sql
     insert into public.surveyors (name, pin, role)
     values ('Your Name', '482913', 'admin');
     ```

3. **Configure environment variables**

   ```bash
   cp .env.local.example .env.local
   ```

   Fill in your Supabase credentials, and generate a session secret for the dashboards:

   ```bash
   openssl rand -base64 32
   ```

   Paste the output as `SESSION_SECRET` in `.env.local`.

   Then set up email sending for the survey's email verification step (see [Email verification](#email-verification) below) and fill in `RESEND_API_KEY` / `EMAIL_FROM`.

4. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) for the landing page and [http://localhost:3000/survey](http://localhost:3000/survey) for the survey.

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing page — waitlist signup, survey CTA |
| `/survey` | Student side hustle validation questionnaire (requires a moderator PIN to start) |
| `/surveylist` | The pre-launch contact list — every respondent and moderator, with copyable emails and phone numbers. Sign in with the admin details (`CONSOLE_EMAIL` / `CONSOLE_PASSWORD`) |
| `/console` | Business console — operators. What each person sees depends on their role |
| `/admin` | Access control — roles and staff. The account owner only |
| `/console/campaigns` | Email marketing dashboard — write, preview, test and send bulk campaigns |
| `/unsubscribe` | Where a campaign's unsubscribe link lands |

## Data

Responses are stored in Supabase tables:

- **`waitlist`** — verified email signups from the landing page's standalone form, and from survey respondents who opted in
- **`survey_responses`** — full survey answers, each linked to the surveyor (`surveyor_id`) who collected it
- **`surveyors`** — surveyor/admin accounts (name, unique PIN, role)
- **`email_verifications`** — short-lived 6-digit codes used to confirm a respondent owns the email they entered (see below)
- **`email_campaigns`** / **`email_campaign_recipients`** — a marketing campaign and one row per person it was sent to, which doubles as the send queue
- **`email_unsubscribes`** — the suppression list, checked before every batch and never overridden by anything
- **`console_roles`** / **`console_staff`** / **`console_staff_roles`** — who works in the console and which tabs their roles open
- **`console_invitations`** — one-time invitation tokens, stored only as hashes

Review responses in the Supabase **Table Editor**, or via `/surveylist`.

### Moderators and the survey list

Field collection is over, so there are no moderator accounts to log into any more — the surveyor dashboards (`/moderator`, `/moderator/signup`, `/dashboard`) and the old `/admin` page are gone, replaced by a single `/surveylist`:

- **Login** uses the same admin details as the console (`CONSOLE_EMAIL` / `CONSOLE_PASSWORD`), posted to `/surveylist/login`. It mints its own cookie (`lib/surveylist/session.ts`), scoped to `/surveylist` — the same credentials open both doors, but neither session is the other, so a stolen list cookie can't open the books.
- **The list** is a contact sheet first (`lib/survey/contacts.ts` + `components/surveylist/ContactsTable.tsx`): name, email, phone, school, primary use and marketing interest, with search, filters, per-value copy, "copy every email", CSV export and paging. Under it sit the moderator table and the full expandable responses.
- **Moderators are contacts too.** Where a moderator also filled the survey their own row is badged; the rest appear name-only, because the `surveyors` table never collected an email.
- Every `/survey` respondent still enters a moderator PIN before question one — that's the only surveyor-facing check left (`lib/survey/pin-actions.ts`), and it's what links a response to whoever collected it (`survey_responses.surveyor_id`).
- New responses trigger a lightweight Realtime Broadcast ping (`lib/survey/realtime.ts`), which tells an open survey list to refetch — no PII is ever sent over that channel, only a "something changed, go refetch" signal.

## Console access control

The console used to have one account: `CONSOLE_EMAIL` / `CONSOLE_PASSWORD` from the environment. It still does — that account is the **owner**, opens every tab, and is deliberately not a database row, so it can't be demoted, deleted, or locked out through the screen that administers everyone else. An empty staff table is a working console.

Everyone else is staff, managed at **`/admin`**.

**A role is a set of console tabs.** Nothing finer for now — no per-record rules, no allow/deny precedence. Someone's access is the union of the roles they hold, so what you tick is exactly what they get. Four roles ship as starting points (Finance, Support, Trust & Safety, Growth); all four are editable and deletable, and none is special to the code.

**Tabs are declared once**, in [`lib/console/tabs.ts`](lib/console/tabs.ts). The sidebar renders from it, the roles editor offers it as checkboxes, the proxy maps a URL to it, and `requireConsole` demands one. `ConsoleTab` is the union of those keys, so a tab that isn't in the list can't be granted, and a page that names a tab which doesn't exist won't compile.

**Inviting someone** (`/admin/staff`) creates the account, attaches the roles, and emails a one-time link through Resend. Only the link's SHA-256 is stored, so a database dump contains no usable way in. They set their own password at `/console/accept?token=…` — the owner never sees it — and land straight on the first tab their role opens. Links expire in 7 days, and re-inviting invalidates the previous one.

**Enforcement is in three places**, on purpose:

1. **`proxy.ts`** maps the URL to a tab and checks the list cached in the session token. This is optimistic and exists for speed — no database round trip on every navigation.
2. **`requireConsole(tab)`** in every page and every server action is the real check. It re-reads the roles from the database on each request, so access removed in `/admin` — or a suspension — takes effect on their very next click rather than when the token expires.
3. **The sidebar** shows only the tabs someone holds. That is a courtesy, not a control; hiding a link protects nobody.

The argument to `requireConsole` is **not optional**, and that is the whole point. Server actions are reachable by direct POST, not only through the UI, so an action that forgot to say which tab it belongs to would be an open door for any signed-in staff member. Making the tab a required parameter turns "did we remember to check?" into a compile error.

**`/admin` has its own sign-in**, using the same owner credentials but a separate two-hour cookie scoped to `/admin`. A console session left open all day can't be walked up to and used to grant somebody the panic desk. Staff can never reach it: it is gated on a password that lives in the environment and cannot be granted by any role.

**Suspend rather than delete** when someone leaves — it is reversible, and it ends their open session immediately.

## Email marketing

`/console/campaigns` sends bulk email to the pre-launch list through Resend. One template, one audience picker, one send button — the parts that are easy to get catastrophically wrong are the parts you cannot edit.

**The template** ([`lib/email/template.ts`](lib/email/template.ts)) is filled in by slots — subject, preview text, heading, body, button, optional banner, closing note — not by typing HTML. Every campaign therefore carries the same header, the same button, the same footer, the same unsubscribe line, and a plain-text alternative built from the same content. `{{first_name}}` and `{{name}}` work in any slot. The composer's live preview calls that exact function in an iframe, so what you approve is byte-for-byte what leaves the building.

**The audience** ([`lib/email/audience.ts`](lib/email/audience.ts)) is the survey and waitlist tables, de-duplicated by address, optionally narrowed by school, minus everyone on the suppression list. App users in `profiles` are deliberately unreachable from here: an account is not a marketing opt-in, and the app promises no promotional messaging.

**The send** ([`lib/console/campaign-actions.ts`](lib/console/campaign-actions.ts)) resolves the audience once into `email_campaign_recipients`, then works through it 100 at a time using Resend's batch endpoint. The queue lives in Postgres, so:

- closing the tab pauses the send instead of losing it — reopen the campaign and press resume;
- a row leaves `pending` the moment it is sent, so nobody is ever mailed twice;
- the suppression list is re-read for every batch, so an unsubscribe that lands mid-send takes effect in *this* campaign;
- a failure that is worth retrying (429, 5xx) leaves the batch pending; one that isn't gets marked failed with the reason, and "Retry failed" puts them back.

**Unsubscribing** is one signed token per address ([`lib/email/unsubscribe.ts`](lib/email/unsubscribe.ts)) — no login, and nobody can unsubscribe anyone else by editing a URL. Every campaign carries `List-Unsubscribe` and `List-Unsubscribe-Post` headers, so Gmail and Yahoo show their own one-click unsubscribe next to the sender name and POST to `/api/email/unsubscribe`; that is now effectively mandatory for bulk senders, and its absence is what pushes mail into spam. The visible footer link lands on `/unsubscribe`, which does **not** unsubscribe on page load — a link scanner opening every URL in the email would otherwise unsubscribe people who never clicked.

**Delivery tracking** is optional and arrives by webhook. Point a Resend webhook at `/api/email/webhook`, put its `whsec_...` secret in `RESEND_WEBHOOK_SECRET`, and delivered/opened/clicked/bounced/complained flow into the dashboard. Hard bounces and spam complaints add themselves to the suppression list within seconds — the single most valuable thing this endpoint does. Without the secret it refuses everything and campaigns simply stop reporting at "sent".

**Before a real send:** send yourself a test from the composer, check it on a phone, and remember a Resend free-tier account covers 3,000 emails a month.

## Email verification

Both the survey and the landing page's standalone waitlist form confirm respondents actually own the email address they enter, using two free layers (no paid third-party service required):

1. **MX record check** (`lib/email/mx.ts`) — a plain DNS lookup (Node's built-in `dns` module, zero cost, zero signup) confirming the email's domain can receive mail at all. Catches typos/fake domains instantly.
2. **Emailed 6-digit code** (`lib/email/verification.ts`) — sent via [Resend](https://resend.com); nothing proceeds until the respondent enters it correctly. This proves they can actually access that inbox. `submitSurvey`/`submitWaitlist` also re-check server-side that the email was verified recently, so the check can't be bypassed by tampering with form data client-side.

In the survey, this only happens if the respondent opts in — see [Survey design](#survey-design) below.

Resend's free tier covers 3,000 emails/month at no cost — there's no paid plan required for this project's volume:

1. Create a free account at [resend.com](https://resend.com)
2. **Verify your domain** (`sydhustle.com`) under **Domains** — required to send to arbitrary respondents. Without domain verification, Resend's sandbox mode only lets you send to your own account email, which is fine for local testing but won't work for real respondents.
3. Create an API key under **API Keys** and set it as `RESEND_API_KEY`
4. Set `EMAIL_FROM` to an address on your verified domain, e.g. `"sydHustle <noreply@sydhustle.com>"`

Verification codes expire after 10 minutes, are rate-limited per email (30s between sends, max 8/day), and rows in `email_verifications` can be pruned periodically (see the comment at the bottom of [`005_email_verifications.sql`](supabase/migrations/005_email_verifications.sql)).

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in **Project Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SESSION_SECRET` (generate with `openssl rand -base64 32` — use a different value than local dev)
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
4. Deploy

## Connect sydhustle.com

1. In Vercel, go to **Project Settings → Domains** and add `sydhustle.com` (and `www.sydhustle.com` if desired)
2. At your domain registrar, update DNS per Vercel's instructions:
   - **A record** pointing to Vercel's IP, or
   - **CNAME** pointing to `cname.vercel-dns.com`
3. Wait for DNS propagation (usually minutes, can take up to 48 hours)
4. Vercel will provision SSL automatically

## Survey design

The survey segments respondents into three groups via `app_usage_role`:

- **`hustling_the_hustles`** — wants to earn by offering services
- **`providing_hustles`** — needs help getting tasks done
- **`both`** — interested in either side

The question flow branches based on `needs_extra_income`:

- **Yes** → hustler track: side hustle interest, availability (`hustle_frequency`, `hours_per_day`), skills (`skills`), and task capability (`hustle_capability` — a can-do/can't-do map keyed by task type)
- **No** → task-poster track: whether they've needed help before (`needs_task_help`) and what type (`task_help_types`)

Every respondent then answers a shared set of validation questions covering trust, payment preference, commission tolerance, and churn risk, followed by an optional "anything else?" field.

The survey's very last question is "Would you like to join the sydHustle waitlist?" (`join_waitlist`):

- **Yes** → asks for email, name, and school, then requires verifying the email (see [Email verification](#email-verification)) before the survey can be submitted. These are stored on the `survey_responses` row and mirrored into the `waitlist` table.
- **No** → skips straight to submission with no contact details collected.

After submission, the "thank you" screen separately asks "Do you want to join the marketing team for sydHustle when the app launches?" — this is intentionally decoupled from the survey itself so it never blocks submission. Answering updates the just-created `survey_responses` row via `submitMarketingInterest` (see `responseId` returned by `submitSurvey`): "yes" prompts for a WhatsApp number (`marketing_whatsapp`), "no" just records the answer (`join_marketing_team`).

## Survey metrics

Key signals to track in Supabase:

- Split of `app_usage_role`: hustlers vs. task posters vs. both — tells you which side of the marketplace is stronger
- % of `would_use_app` = "yes", and % `commission_willingness` = "yes" — willingness to adopt and pay a platform fee
- Most common `hustle_capability` entries marked `can_do` vs. most common `task_help_types` — supply/demand match by task category
- Most common `concerns`, `uninstall_reasons`, and `trust_factors` — what to fix before launch
- Average `hours_per_day` and distribution of `hustle_frequency` — expected hustler availability
- % of `join_waitlist` = "yes" — how many respondents want to be notified at launch
- % of `join_marketing_team` = "yes" — pool of respondents interested in helping market the app at launch
