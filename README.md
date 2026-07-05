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
   - Open the SQL Editor and run the migration in [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql)
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

## Survey metrics

Key signals to track in Supabase:

- Average `interest_score` (1–5)
- % of `would_use` = "definitely" or "probably"
- Most common `challenges` and `desired_features`
- % of respondents with an active side hustle (`has_side_hustle` = "yes")
