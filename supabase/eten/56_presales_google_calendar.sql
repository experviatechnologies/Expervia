-- ============================================================================
-- ETEN Presales Tracker - 56 - Offer Google Calendar (Phase 8, step 8.4)
-- (5 Nov 2026)
-- ----------------------------------------------------------------------------
-- Run AFTER 54 and 55. Safe to re-run.
--
-- Shows the "Connect Google Calendar" button in the tracker. It only works
-- once GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and CALENDAR_TOKEN_KEY are set
-- in Vercel; until then the button stays disabled. Google connections use the
-- same presales_calendar_connections table as Microsoft (provider 'google').
-- ============================================================================

update public.presales_settings set google_enabled = true where id;
