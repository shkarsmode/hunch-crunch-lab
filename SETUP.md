# Hunch Crunch Lab: setup

The site already works without any of this: each video's setup is free, everything else shows the $3 unlock. These steps switch on Google sign-in, the admin panel, the supporter wall, ideas and Patreon. Do them in order; nothing here costs money.

## 1. Supabase (database and sign-in, free plan)

1. supabase.com → New project. Pick a region close to the US. Save the database password somewhere safe.
2. SQL Editor → paste all of `supabase/migrations/0001_init.sql` → Run.
3. Authentication → Sign In / Providers: turn **Email off** (and every other provider), turn **Google on** with the client ID and secret from step 2.
4. Authentication → URL Configuration: Site URL `https://<your-app>.vercel.app`, Redirect URLs `https://<your-app>.vercel.app/auth/callback` and `http://localhost:3210/auth/callback`.
5. Project Settings → API keys: copy the Project URL, the anon (publishable) key and the service_role (secret) key.

## 2. Google sign-in

1. console.cloud.google.com → APIs & Services → OAuth consent screen: External, app name "Hunch Crunch Lab", scopes only `openid`, `email`, `profile`, then Publish. These basic scopes need no Google review.
2. Credentials → Create credentials → OAuth client ID → Web application. Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`.
3. Paste the client ID and secret into Supabase (step 1.3).

## 3. Patreon ($3 tier)

1. Create the creator page with one tier: $3/month, "Full lab". Payouts go through Payoneer (PayPal payouts aren't offered for Ukraine).
2. patreon.com/portal/registration/register-clients → Create client. Redirect URI: `https://<your-app>.vercel.app/api/patreon/callback`. Copy the Client ID and Client Secret.
3. Campaign ID: open `https://www.patreon.com/api/oauth2/v2/campaigns` with the creator access token from the same page; it's `data[0].id`.
4. patreon.com/portal/registration/register-webhooks → URL `https://<your-app>.vercel.app/api/patreon/webhook`, triggers: members:create, members:update, members:delete, members:pledge:create, members:pledge:update, members:pledge:delete. Copy the webhook secret.

## 4. Vercel environment variables

Project → Settings → Environment Variables (Production), then Deployments → Redeploy.

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (publishable) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key (secret) |
| `ADMIN_EMAILS` | your Google email (comma-separated for more) |
| `NEXT_PUBLIC_PATREON_URL` | `https://www.patreon.com/<your page>` |
| `PATREON_CLIENT_ID` | from 3.2 |
| `PATREON_CLIENT_SECRET` | from 3.2 (secret) |
| `PATREON_CAMPAIGN_ID` | from 3.3 |
| `PATREON_WEBHOOK_SECRET` | from 3.4 (secret) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | optional, shown on Privacy and Terms |

Patreon unlocks switch on only when the four `PATREON_*` values are set.

## Money and abuse protection

Already in the code:
- The database is closed to the browser: row-level security is on with no public rules, and the public key can't run the database functions. Only the server, with the secret key, can read or write.
- Every write checks the origin, caps the body size, and is rate-limited per IP. Supporters can send 3 ideas a day. Visit stats are daily counters, so spam can't grow the table without bound.
- Public lists (supporter wall, ideas) are cached at Vercel's edge for 60 seconds, so a flood hits the CDN, not the database.
- Secrets live only in Vercel environment variables; the service key never reaches the browser.
- Security headers: Content-Security-Policy, no framing, HSTS, nosniff, strict referrer, permissions policy.
- Patreon sign-in uses a one-time state cookie, and webhooks are checked with the Patreon signature.

On your side:
- Free plans can't bill you. When a free limit is hit, Vercel and Supabase pause instead of charging. If you ever upgrade: Vercel → Settings → Billing → Spend Management (set a limit and pause at it); Supabase → Billing → keep the Spend Cap on.
- Under attack: Vercel → Firewall → Attack Challenge Mode (free, one click).
- Vercel Hobby is for non-commercial use, and paid access counts as commercial. Before you set the Patreon variables, move the project to Pro ($20/month, set a spend limit) or another host. Donations without paid unlocks are fine on Hobby.
- A Supabase free project pauses after a week with no requests. Regular visits keep it awake; if it pauses, restore it in the dashboard.

## Local development

```
npm install
npm run dev
```

For sign-in locally, put the variables from the table above into `.env.local` (it's git-ignored).

Add `?dev_unlock=1` to a lab URL to preview the full lab locally (`?dev_unlock=0` turns it off). It never works in production.
