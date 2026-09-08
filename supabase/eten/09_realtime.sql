-- ============================================================================
-- ETEN Phase 1 — 09 · Realtime  (live messaging)
-- ----------------------------------------------------------------------------
-- Run AFTER 01–08. Idempotent.
--
-- Adds the messaging + notifications tables to the `supabase_realtime`
-- publication so the browser can subscribe to INSERTs and show new messages /
-- notifications live. Realtime honours RLS: a subscriber only receives change
-- events for rows they're allowed to SELECT (messages_select = participant,
-- notifications_select_self = recipient), so nothing leaks across conversations.
-- ============================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
