-- ============================================================================
-- ETEN — 19 · Mentorship notifications  [Mentorship M5.1]
-- ----------------------------------------------------------------------------
-- Run AFTER 01–18. Idempotent.
--
-- Adds a 'mentorship' value to the notification_type enum so mentorship events
-- (added to a Circle, Circle activated, new assignment, evidence reviewed,
-- verified as a mentor, Circle completed) can use the existing notify() system
-- and notification_preferences. Members default to on for the category.
-- ============================================================================

alter type public.notification_type add value if not exists 'mentorship';
