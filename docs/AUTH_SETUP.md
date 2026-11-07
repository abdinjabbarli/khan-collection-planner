# Google sign-in and profile: setup

Only public values are used in the app. The Google Client Secret lives only in Supabase (Authentication > Providers > Google). Never commit a secret, service_role key or database password.

## 1. Database (once)

Open the Supabase project `scosqqqfvdyloqlaodpm` > **SQL Editor**, paste the contents of `supabase/migrations/20261107000000_create_profiles.sql`, and run it. It is idempotent. It creates `public.profiles` (keyed to `auth.users`), enables Row Level Security (users can only select/insert/update their own row), makes `id` and timestamps non-writable by clients, and adds a signup trigger plus a backfill.

Check afterwards: **Table Editor** shows `profiles` with RLS enabled, and **Authentication > Policies** lists three `profiles_*_own` policies.

## 2. Netlify environment variables

Site configuration > Environment variables > Add a variable (scope: all deploy contexts):

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://scosqqqfvdyloqlaodpm.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_OK7Zg86ZlGmRLweGljJ1LA_8J41DMLX` |

Vite inlines these at build time, so after adding or changing them trigger **Deploys > Trigger deploy > Clear cache and deploy site**.

## 3. Supabase URL settings

Authentication > URL Configuration:
- **Site URL**: `https://timely-sunflower-ea28d3.netlify.app`
- **Redirect URLs**: `https://timely-sunflower-ea28d3.netlify.app/**` and, for local dev, `http://localhost:5173/**`

The app redirects back to `<current origin>/`. Netlify deploy-preview origins are not in the allow-list, so sign-in from a preview falls back to the Site URL; test sign-in on production or add the preview pattern deliberately.

## 4. Google

- Google Cloud > OAuth client (Web): **Authorized redirect URI** `https://scosqqqfvdyloqlaodpm.supabase.co/auth/v1/callback`.
- OAuth consent screen: app home page the live site URL, privacy policy `https://timely-sunflower-ea28d3.netlify.app/privacy`, scopes only `openid`, `email`, `profile` (no Gmail/Drive).
- Supabase > Authentication > Providers > Google is enabled with the client ID and secret (the secret is entered only there).

## 5. Security headers

`netlify.toml` sends a Content-Security-Policy allowing this site, the Supabase project (`connect-src`), The Color API, and `https://*.googleusercontent.com` profile images. If you change the Supabase project URL, update the CSP too.

## Local development

Copy `.env.example` to `.env.local`, run `npm run dev`, and make sure `http://localhost:5173/**` is in the Supabase redirect list.
