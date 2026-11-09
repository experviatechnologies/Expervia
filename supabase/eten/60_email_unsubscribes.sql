-- ============================================================================
-- ETEN - 60 - Unsubscribes from admin broadcast emails (9 Nov 2026)
-- ----------------------------------------------------------------------------
-- Run AFTER 59. Safe to re-run.
--
-- Admin broadcasts (Admin > Email) now carry an unsubscribe link and Gmail's
-- one-click unsubscribe header. Anyone who unsubscribes is listed here and
-- left out of every later broadcast. Account, session and payment emails are
-- not affected: people need those to use their account.
--
-- Keyed by email (lower case), not member id, because a broadcast can go to a
-- manual list of addresses that have no account. Only the server reads or
-- writes it (service_role), so RLS is on with no policies.
-- ============================================================================

create table if not exists public.email_unsubscribes (
  email            text primary key check (email = lower(email)),
  unsubscribed_at  timestamptz not null default now(),
  -- 'link' (the unsubscribe page) or 'one_click' (the inbox's own button).
  source           text not null default 'link'
);

alter table public.email_unsubscribes enable row level security;
