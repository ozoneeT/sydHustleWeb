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
   - Open the SQL Editor and run the migrations in order: [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql), then [`supabase/migrations/002_survey_redesign.sql`](supabase/migrations/002_survey_redesign.sql), then [`supabase/migrations/003_marketing_team_and_waitlist_fields.sql`](supabase/migrations/003_marketing_team_and_waitlist_fields.sql)
   - Copy your project URL, anon key, and service role key from **Project Settings → API**

3. **Configure environment variables**

   ```bash
   cp .env.local.example .env.local
   ```

   Fill in your Supabase credentials in `.env.local`.

4. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) for the landing page and [http://localhost:3000/survey](http://localhost:3000/survey) for the survey.

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing page — waitlist signup, survey CTA |
| `/survey` | Student side hustle validation questionnaire |

## Data

Responses are stored in two Supabase tables:

- **`waitlist`** — email signups from the landing page (and optional emails from the survey)
- **`survey_responses`** — full survey answers

Review responses in the Supabase **Table Editor** dashboard.

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in **Project Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
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
