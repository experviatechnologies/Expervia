# ETEN Mentorship — Launch Checklist

Go-live steps for the standalone mentorship product. Grouped by owner. Most of
these are dashboard/DNS configuration, not code.

## 1. Database (Supabase SQL editor, run in order, once each)

- [ ] Migrations `01`–`23` are already applied.
- [ ] Run `supabase/eten/24_mentor_directory.sql` (adds the public verified-mentor directory view).
- [ ] Confirm RLS is enabled on all tables (it is by design; the MP-6.2 audit verified all 38).

## 2. Email deliverability (Resend + DNS)

- [ ] `RESEND_API_KEY` set in the environment.
- [ ] `CONTACT_FROM_EMAIL` set to an address on a **verified** Resend domain (not `resend.dev`).
- [ ] `CONTACT_TO_EMAIL` set (contact-form destination).
- [ ] Domain verified in Resend, with **SPF**, **DKIM** and a **DMARC** record added at DNS. Without these, mail lands in spam.
- [ ] Send a test to [mail-tester.com](https://www.mail-tester.com) and confirm a good score.

## 3. Subdomain (Vercel + DNS + Supabase)

- [ ] `mentorship.experviatechnologies.com` added in Vercel → Domains and showing **Valid** (DNS + SSL).
- [ ] `NEXT_PUBLIC_MENTORSHIP_HOST=mentorship.experviatechnologies.com` set in Vercel (Production).
- [ ] Optional: `NEXT_PUBLIC_COOKIE_DOMAIN=.experviatechnologies.com` if a shared session across subdomains is wanted.
- [ ] Redeploy after setting the env vars (they are baked in at build).
- [ ] Supabase → Authentication → URL Configuration → Redirect URLs includes `https://mentorship.experviatechnologies.com/**`.
- [ ] Visiting the subdomain serves the mentorship landing at the root, with **no** Expervia navbar/footer.

## 4. Bot protection (Cloudflare Turnstile)

- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` set in Vercel.
- [ ] The Turnstile widget appears on the registration form once keys are live.
- [ ] Until keys are set, the honeypot + disposable-email + rate-limit guards still run.

## 5. Smoke tests (production)

- [ ] Register a Prospect (mentee) → confirmation email arrives → link signs in → mentee dashboard.
- [ ] Register a Prospect (mentor) → lands on the mentor dashboard.
- [ ] Forgot password (member and mentorship) → reset email arrives → new password works.
- [ ] Validate a Prospect via onboarding → returns to the mentorship dashboard as Validated.
- [ ] Ops verify a mentor application in `/admin/mentors`.
- [ ] A verified mentor creates a Circle, enrols a Validated mentee, activates it, adds a session, posts an assignment, reviews evidence, and completes the Circle.
- [ ] Confirm recognition (Expert Score + Circle Graduate / Circle Mentor badges) appears.
- [ ] Sign out works from the mentee and mentor dashboards (desktop and mobile).

## 6. Ops visibility

- [ ] `/admin/mentorship` shows the funnel KPIs, programme metrics (verified mentors, active/completed Circles, graduations) and the per-capability-area breakdown.

## Environment variables (reference)

| Variable                                                     | Purpose                                 |
| ------------------------------------------------------------ | --------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client (browser + server, RLS) |
| `SUPABASE_SERVICE_ROLE_KEY`                                  | Server-only privileged writes           |
| `RESEND_API_KEY`                                             | Transactional + auth email              |
| `CONTACT_FROM_EMAIL` / `CONTACT_TO_EMAIL`                    | Email sender / contact destination      |
| `NEXT_PUBLIC_MENTORSHIP_HOST`                                | Turns on the subdomain host rewrite     |
| `NEXT_PUBLIC_COOKIE_DOMAIN`                                  | Optional shared-session cookie domain   |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`    | Cloudflare Turnstile                    |
