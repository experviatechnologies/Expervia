-- ============================================================================
-- ETEN Mentorship - 43 - Guest booking fields (public booking page, PB-2)
-- ----------------------------------------------------------------------------
-- Run AFTER 42. Idempotent (safe to re-run).
--
-- The public booking page (/mentorship/book/[mentorId]) lets a guest book and
-- pay for a session without an account; a member is provisioned for them behind
-- the scenes. These columns carry the extra context that flow collects:
--
--   guest_goal            what the guest wants help with (shown to the mentor)
--   guest_timezone        the IANA zone the guest booked in (for their emails)
--   guest_welcome_sent_at stamped once the post-payment welcome/claim email has
--                         gone out, so a page refresh never re-sends it
--
-- All nullable: a normal in-app booking simply leaves them empty. Writes stay on
-- the service_role path (the gated server action), so no policy changes.
-- ============================================================================

alter table public.session_bookings
  add column if not exists guest_goal            text,
  add column if not exists guest_timezone        text,
  add column if not exists guest_welcome_sent_at timestamptz;

alter table public.session_bookings
  drop constraint if exists session_bookings_guest_goal_len;
alter table public.session_bookings
  add constraint session_bookings_guest_goal_len
    check (guest_goal is null or char_length(guest_goal) <= 1000);
