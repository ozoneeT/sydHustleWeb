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
   - Open the SQL Editor and run the migrations in order: [`001_initial.sql`](supabase/migrations/001_initial.sql), [`002_survey_redesign.sql`](supabase/migrations/002_survey_redesign.sql), [`003_marketing_team_and_waitlist_fields.sql`](supabase/migrations/003_marketing_team_and_waitlist_fields.sql), then [`004_surveyors.sql`](supabase/migrations/004_surveyors.sql)
   - Copy your project URL, anon key, and service role key from **Project Settings → API**
   - **Seed your admin account** — surveyors sign themselves up, but the first admin has to be inserted manually. Run this in the SQL editor with your own name and a PIN you choose:
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
| `/moderator` | Log in with name + PIN — routes to `/dashboard` (surveyor) or `/admin` |
| `/moderator/signup` | Surveyors sign up with just their name and get a unique 6-digit PIN |
| `/dashboard` | A surveyor's own responses, live counts, and their PIN to reshare |
| `/admin` | All responses across every surveyor, with a per-surveyor leaderboard |

## Data

Responses are stored in Supabase tables:

- **`waitlist`** — email signups from the landing page (and optional emails from the survey)
- **`survey_responses`** — full survey answers, each linked to the surveyor (`surveyor_id`) who collected it
- **`surveyors`** — surveyor/admin accounts (name, unique PIN, role)

Review responses in the Supabase **Table Editor**, or via the `/admin` dashboard.

### Moderator / surveyor accounts

There are no passwords or email-based accounts for surveyors — this is intentionally lightweight for a small internal team:

- **Sign up** (`/moderator/signup`) just takes a name. The server generates a random, unique 6-digit PIN and shows it once — the surveyor needs to save it.
- **Login** (`/moderator`) takes name + PIN. On success, a signed session cookie is issued (see `lib/moderator/session.ts`); there's no Supabase Auth involved.
- Every `/survey` respondent must enter a valid moderator PIN before question one — this is what links their response to a surveyor (`survey_responses.surveyor_id`).
- Dashboards use React's `cache()`-backed Data Access Layer (`lib/moderator/dal.ts`) to verify the session and scope every query to the logged-in surveyor (or, for admins, to everyone). `proxy.ts` only does a fast optimistic redirect; the real authorization check happens in the DAL on every request.
- New responses trigger a lightweight Realtime Broadcast ping (`lib/moderator/realtime.ts`) to the relevant surveyor's channel and the admin channel, which tells open dashboards to refresh — no PII is ever sent over that channel, only a "something changed, go refetch" signal.

**Known trade-off:** a 6-digit PIN is a small guess-space (there's no rate-limiting yet). This is fine for a small, trusted team of surveyors, but isn't meant to scale to a public-facing login.

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in **Project Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SESSION_SECRET` (generate with `openssl rand -base64 32` — use a different value than local dev)
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

Every respondent then answers a shared set of validation questions covering trust, payment preference, commission tolerance, and churn risk.

The survey's "Get early access" step collects email, name, and school — these are stored on the `survey_responses` row itself and, when an email is provided, are also mirrored into the `waitlist` table so respondent details aren't lost even if the waitlist row already exists.

The very last question asks whether the respondent would join the sydHustle marketing team at launch (`join_marketing_team`). Answering "yes" prompts for a WhatsApp number (`marketing_whatsapp`); answering "no" skips straight to submission.

## Survey metrics

Key signals to track in Supabase:

- Split of `app_usage_role`: hustlers vs. task posters vs. both — tells you which side of the marketplace is stronger
- % of `would_use_app` = "yes", and % `commission_willingness` = "yes" — willingness to adopt and pay a platform fee
- Most common `hustle_capability` entries marked `can_do` vs. most common `task_help_types` — supply/demand match by task category
- Most common `concerns`, `uninstall_reasons`, and `trust_factors` — what to fix before launch
- Average `hours_per_day` and distribution of `hustle_frequency` — expected hustler availability
- % of `join_marketing_team` = "yes" — pool of respondents interested in helping market the app at launch
