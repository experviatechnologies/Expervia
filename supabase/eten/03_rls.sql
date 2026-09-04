-- ============================================================================
-- ETEN Phase 1 — 03 · Row-Level Security policies
-- ----------------------------------------------------------------------------
-- Run AFTER 01_schema.sql and 02_functions.sql. Idempotent: each policy is
-- dropped and recreated, so re-running just refreshes the rules.
--
-- Model:
--   * anon (public key, no session)  -> no policies apply = DENY everywhere.
--   * authenticated (member session) -> the policies below.
--   * service_role (server key)       -> bypasses RLS entirely; used for signup
--     provisioning, writing notifications, and audit_log.
--
-- `audit_log` intentionally gets NO policies (server-written only).
-- Verification columns on certifications are additionally guarded by a trigger
-- (defined here) so a member cannot self-verify.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- members — a member sees/edits only their own identity; ops manages status/role.
-- (members rows are CREATED server-side at signup/provisioning via service_role,
--  so there is deliberately no member/anon INSERT policy.)
-- ----------------------------------------------------------------------------
drop policy if exists members_select on public.members;
create policy members_select on public.members for select to authenticated
  using (id = auth.uid() or public.is_operations());

drop policy if exists members_update_ops on public.members;
create policy members_update_ops on public.members for update to authenticated
  using (public.is_operations()) with check (public.is_operations());

-- ----------------------------------------------------------------------------
-- profiles — public profile readable by any active member; unclaimed (migrated,
-- not yet activated) profiles stay private; a member edits only their own.
-- ----------------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (
    member_id = auth.uid()
    or public.is_operations()
    or (
      public.is_active_member()
      and exists (
        select 1 from public.members m
        where m.id = profiles.member_id
          and m.claimed_at is not null
          and m.status = 'active'
      )
    )
  );

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles for insert to authenticated
  with check (member_id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
  using (member_id = auth.uid()) with check (member_id = auth.uid());

-- ----------------------------------------------------------------------------
-- certifications — owner + ops read; owner writes; verification is ops-only,
-- enforced by the guard trigger (members cannot self-verify).
-- ----------------------------------------------------------------------------
create or replace function public.guard_certification_verification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_operations() then
    return new;                       -- ops may set verification fields freely
  end if;
  if tg_op = 'INSERT' then
    new.verification_status := 'unverified';
    new.verified_by         := null;
    new.verified_at         := null;
  elsif tg_op = 'UPDATE' then
    new.verification_status := old.verification_status;
    new.verified_by         := old.verified_by;
    new.verified_at         := old.verified_at;
  end if;
  return new;
end $$;

drop trigger if exists certifications_guard_verification on public.certifications;
create trigger certifications_guard_verification
  before insert or update on public.certifications
  for each row execute function public.guard_certification_verification();

drop policy if exists certifications_select on public.certifications;
create policy certifications_select on public.certifications for select to authenticated
  using (member_id = auth.uid() or public.is_operations());

drop policy if exists certifications_insert_self on public.certifications;
create policy certifications_insert_self on public.certifications for insert to authenticated
  with check (member_id = auth.uid());

drop policy if exists certifications_update on public.certifications;
create policy certifications_update on public.certifications for update to authenticated
  using (member_id = auth.uid() or public.is_operations())
  with check (member_id = auth.uid() or public.is_operations());

drop policy if exists certifications_delete on public.certifications;
create policy certifications_delete on public.certifications for delete to authenticated
  using (member_id = auth.uid() or public.is_operations());

-- ----------------------------------------------------------------------------
-- pods & skills — readable by all active members; writable by ops only.
-- ----------------------------------------------------------------------------
drop policy if exists pods_select on public.pods;
create policy pods_select on public.pods for select to authenticated
  using (public.is_active_member() or public.is_operations());

drop policy if exists pods_write_ops on public.pods;
create policy pods_write_ops on public.pods for all to authenticated
  using (public.is_operations()) with check (public.is_operations());

drop policy if exists skills_select on public.skills;
create policy skills_select on public.skills for select to authenticated
  using (public.is_active_member() or public.is_operations());

drop policy if exists skills_write_ops on public.skills;
create policy skills_write_ops on public.skills for all to authenticated
  using (public.is_operations()) with check (public.is_operations());

-- ----------------------------------------------------------------------------
-- member_skills — visible to members (shown on profiles); owner adds/removes own.
-- ----------------------------------------------------------------------------
drop policy if exists member_skills_select on public.member_skills;
create policy member_skills_select on public.member_skills for select to authenticated
  using (public.is_active_member() or public.is_operations());

drop policy if exists member_skills_insert_self on public.member_skills;
create policy member_skills_insert_self on public.member_skills for insert to authenticated
  with check (member_id = auth.uid());

drop policy if exists member_skills_delete_self on public.member_skills;
create policy member_skills_delete_self on public.member_skills for delete to authenticated
  using (member_id = auth.uid());

-- ----------------------------------------------------------------------------
-- pod_memberships — rosters visible to members; self join/leave; role is ops-only.
-- ----------------------------------------------------------------------------
drop policy if exists pod_memberships_select on public.pod_memberships;
create policy pod_memberships_select on public.pod_memberships for select to authenticated
  using (public.is_active_member() or public.is_operations());

drop policy if exists pod_memberships_join_self on public.pod_memberships;
create policy pod_memberships_join_self on public.pod_memberships for insert to authenticated
  with check (
    (member_id = auth.uid() and role_in_pod = 'member')  -- self-join, never self-appoint
    or public.is_operations()
  );

drop policy if exists pod_memberships_role_ops on public.pod_memberships;
create policy pod_memberships_role_ops on public.pod_memberships for update to authenticated
  using (public.is_operations()) with check (public.is_operations());

drop policy if exists pod_memberships_leave on public.pod_memberships;
create policy pod_memberships_leave on public.pod_memberships for delete to authenticated
  using (member_id = auth.uid() or public.is_operations());

-- ----------------------------------------------------------------------------
-- posts — visible per can_see_post(); author creates; author/ops/target-pod lead
-- may edit (removal). Hard delete is service_role-only (NDPA path).
-- ----------------------------------------------------------------------------
drop policy if exists posts_select on public.posts;
create policy posts_select on public.posts for select to authenticated
  using (public.can_see_post(id));

drop policy if exists posts_insert_self on public.posts;
create policy posts_insert_self on public.posts for insert to authenticated
  with check (author_id = auth.uid() and public.is_active_member());

drop policy if exists posts_update on public.posts;
create policy posts_update on public.posts for update to authenticated
  using (author_id = auth.uid() or public.is_operations() or public.leads_any_target_pod(id))
  with check (author_id = auth.uid() or public.is_operations() or public.leads_any_target_pod(id));

-- ----------------------------------------------------------------------------
-- post_targets — read if the pod is visible; only the post's author (or ops) sets.
-- ----------------------------------------------------------------------------
drop policy if exists post_targets_select on public.post_targets;
create policy post_targets_select on public.post_targets for select to authenticated
  using (public.can_see_pod(pod_id));

drop policy if exists post_targets_insert on public.post_targets;
create policy post_targets_insert on public.post_targets for insert to authenticated
  with check (
    public.is_operations()
    or exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
  );

drop policy if exists post_targets_delete on public.post_targets;
create policy post_targets_delete on public.post_targets for delete to authenticated
  using (
    public.is_operations()
    or exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- post_attachments & post_tags — read if the post is visible; author/ops write.
-- ----------------------------------------------------------------------------
drop policy if exists post_attachments_select on public.post_attachments;
create policy post_attachments_select on public.post_attachments for select to authenticated
  using (public.can_see_post(post_id));

drop policy if exists post_attachments_write on public.post_attachments;
create policy post_attachments_write on public.post_attachments for all to authenticated
  using (
    public.is_operations()
    or exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
  )
  with check (
    public.is_operations()
    or exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
  );

drop policy if exists post_tags_select on public.post_tags;
create policy post_tags_select on public.post_tags for select to authenticated
  using (public.can_see_post(post_id));

drop policy if exists post_tags_write on public.post_tags;
create policy post_tags_write on public.post_tags for all to authenticated
  using (
    public.is_operations()
    or exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
  )
  with check (
    public.is_operations()
    or exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- comments — visible if the post is visible and not removed (moderators keep
-- sight of removed); author creates; author/ops/lead may edit (removal).
-- ----------------------------------------------------------------------------
drop policy if exists comments_select on public.comments;
create policy comments_select on public.comments for select to authenticated
  using (
    public.can_see_post(post_id)
    and (
      is_removed = false
      or author_id = auth.uid()
      or public.is_operations()
      or public.leads_any_target_pod(post_id)
    )
  );

drop policy if exists comments_insert_self on public.comments;
create policy comments_insert_self on public.comments for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.is_active_member()
    and public.can_see_post(post_id)
  );

drop policy if exists comments_update on public.comments;
create policy comments_update on public.comments for update to authenticated
  using (author_id = auth.uid() or public.is_operations() or public.leads_any_target_pod(post_id))
  with check (author_id = auth.uid() or public.is_operations() or public.leads_any_target_pod(post_id));

-- ----------------------------------------------------------------------------
-- reactions — visible if the target is visible; one per member per item; owner
-- adds / changes / removes their own.
-- ----------------------------------------------------------------------------
drop policy if exists reactions_select on public.reactions;
create policy reactions_select on public.reactions for select to authenticated
  using (
    (target_type = 'post' and public.can_see_post(target_id))
    or (target_type = 'comment' and exists (
      select 1 from public.comments c where c.id = target_id and public.can_see_post(c.post_id)
    ))
  );

drop policy if exists reactions_insert_self on public.reactions;
create policy reactions_insert_self on public.reactions for insert to authenticated
  with check (
    member_id = auth.uid()
    and public.is_active_member()
    and (
      (target_type = 'post' and public.can_see_post(target_id))
      or (target_type = 'comment' and exists (
        select 1 from public.comments c where c.id = target_id and public.can_see_post(c.post_id)
      ))
    )
  );

drop policy if exists reactions_update_self on public.reactions;
create policy reactions_update_self on public.reactions for update to authenticated
  using (member_id = auth.uid()) with check (member_id = auth.uid());

drop policy if exists reactions_delete_self on public.reactions;
create policy reactions_delete_self on public.reactions for delete to authenticated
  using (member_id = auth.uid());

-- ----------------------------------------------------------------------------
-- MESSAGING — everything scoped to conversation participants; blocked pairs
-- cannot be added to a conversation or exchange messages.
-- ----------------------------------------------------------------------------
drop policy if exists conversations_select on public.conversations;
create policy conversations_select on public.conversations for select to authenticated
  using (public.is_conversation_participant(id));

drop policy if exists conversations_insert on public.conversations;
create policy conversations_insert on public.conversations for insert to authenticated
  with check (created_by = auth.uid() and public.is_active_member());

drop policy if exists conversations_update on public.conversations;
create policy conversations_update on public.conversations for update to authenticated
  using (public.is_conversation_participant(id))
  with check (public.is_conversation_participant(id));

drop policy if exists conv_participants_select on public.conversation_participants;
create policy conv_participants_select on public.conversation_participants for select to authenticated
  using (public.is_conversation_participant(conversation_id));

-- The conversation creator adds participants; you cannot add someone you have
-- blocked or who has blocked you.
drop policy if exists conv_participants_insert on public.conversation_participants;
create policy conv_participants_insert on public.conversation_participants for insert to authenticated
  with check (
    exists (select 1 from public.conversations c where c.id = conversation_id and c.created_by = auth.uid())
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = member_id)
         or (b.blocker_id = member_id and b.blocked_id = auth.uid())
    )
  );

-- A member updates only their own row (drives last_read_at / read receipts).
drop policy if exists conv_participants_update_self on public.conversation_participants;
create policy conv_participants_update_self on public.conversation_participants for update to authenticated
  using (member_id = auth.uid()) with check (member_id = auth.uid());

-- Leave yourself; the creator may remove participants.
drop policy if exists conv_participants_delete on public.conversation_participants;
create policy conv_participants_delete on public.conversation_participants for delete to authenticated
  using (
    member_id = auth.uid()
    or exists (select 1 from public.conversations c where c.id = conversation_id and c.created_by = auth.uid())
  );

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages for select to authenticated
  using (public.is_conversation_participant(conversation_id));

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and public.is_conversation_participant(conversation_id)
    and not public.conversation_has_block(conversation_id)
  );

drop policy if exists message_attachments_select on public.message_attachments;
create policy message_attachments_select on public.message_attachments for select to authenticated
  using (exists (
    select 1 from public.messages m
    where m.id = message_id and public.is_conversation_participant(m.conversation_id)
  ));

drop policy if exists message_attachments_insert on public.message_attachments;
create policy message_attachments_insert on public.message_attachments for insert to authenticated
  with check (exists (
    select 1 from public.messages m where m.id = message_id and m.sender_id = auth.uid()
  ));

-- blocks — a member manages only their own block list.
drop policy if exists blocks_select_self on public.blocks;
create policy blocks_select_self on public.blocks for select to authenticated
  using (blocker_id = auth.uid());

drop policy if exists blocks_insert_self on public.blocks;
create policy blocks_insert_self on public.blocks for insert to authenticated
  with check (blocker_id = auth.uid());

drop policy if exists blocks_delete_self on public.blocks;
create policy blocks_delete_self on public.blocks for delete to authenticated
  using (blocker_id = auth.uid());

-- ----------------------------------------------------------------------------
-- notifications — a member sees only their own; rows are WRITTEN by the server
-- (service_role), so there is no member INSERT policy.
-- ----------------------------------------------------------------------------
drop policy if exists notifications_select_self on public.notifications;
create policy notifications_select_self on public.notifications for select to authenticated
  using (recipient_id = auth.uid());

drop policy if exists notifications_update_self on public.notifications;
create policy notifications_update_self on public.notifications for update to authenticated
  using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

drop policy if exists notifications_delete_self on public.notifications;
create policy notifications_delete_self on public.notifications for delete to authenticated
  using (recipient_id = auth.uid());

-- notification_preferences — a member manages only their own.
drop policy if exists notif_prefs_all_self on public.notification_preferences;
create policy notif_prefs_all_self on public.notification_preferences for all to authenticated
  using (member_id = auth.uid()) with check (member_id = auth.uid());

-- ----------------------------------------------------------------------------
-- reports — reporter files & sees own; ops read + resolve. (Pod-lead read of
-- reports on their pod's content is deferred to the M4 moderation console.)
-- ----------------------------------------------------------------------------
drop policy if exists reports_select on public.reports;
create policy reports_select on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_operations());

drop policy if exists reports_insert_self on public.reports;
create policy reports_insert_self on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and public.is_active_member());

drop policy if exists reports_resolve_ops on public.reports;
create policy reports_resolve_ops on public.reports for update to authenticated
  using (public.is_operations()) with check (public.is_operations());

-- audit_log — no policies on purpose: server (service_role) writes and reads only.
