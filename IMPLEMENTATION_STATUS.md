# Klarus AI implementation status

The original website's branding and design are preserved.

## Changes on development
- Contact form sends enquiries to `/api/contact`, with validation and status messages.
- Vercel function validates inputs and inserts into Supabase.
- SQL migration creates `public.contact_enquiries` with RLS enabled and no public inserts.
- Supabase client credentials are read from Vite environment variables.

## Required before launch
1. Execute `supabase/contact_enquiries.sql` in the correct Supabase project.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel build environment.
3. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as server-only Vercel environment variables. Never expose the service role key to the browser or commit it.
4. Run `npm ci`, `npm run lint`, `npm run build`.
5. Verify submission in a preview deployment with a test enquiry.
6. Add rate limiting/bot defense, verify genuine contact details and privacy policy before production.

Do not merge into `main` until these tests pass.
