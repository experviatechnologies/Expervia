-- ============================================================================
-- ETEN - 70 - CRM: Mentorship activity on contact timelines (25 Nov 2026)
-- ----------------------------------------------------------------------------
-- Run AFTER 69 (uses crm_sync_member). Safe to re-run.
--
-- Triggers on the Mentorship tables write to the CRM timeline of the people
-- involved, whatever made the change (the app, a Paystack webhook, an admin):
--   session_bookings     booked, accepted, declined, cancelled, expired
--   payments             paid, refunded (payer only; amounts as charged)
--   mentorship_requests  asked, accepted, declined, withdrawn
--   mentor_profiles      became a mentor, mentor level changed
--   session_attendance   attended a circle session
-- Each event has a dedupe key, so re-running this file, or a webhook firing
-- twice, never writes the same line twice.
--
-- None of this can block Mentorship: every trigger turns errors into a
-- warning in the database log. The backfill at the end adds past events.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Helpers
-- ----------------------------------------------------------------------------

-- Log one line on a member's CRM contact (created first if missing).
create or replace function public.crm_log_member_event(
  p_member   uuid,
  p_event    text,
  p_subject  text,
  p_body     text,
  p_payload  jsonb,
  p_when     timestamptz,
  p_dedupe   text
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_contact uuid;
begin
  if p_member is null then return; end if;
  select id into v_contact from public.crm_contacts where member_id = p_member;
  if v_contact is null then
    v_contact := public.crm_sync_member(p_member);
  end if;
  if v_contact is null then return; end if;

  insert into public.crm_activities
    (contact_id, type, product, event, subject, body, payload, occurred_at, dedupe_key)
  values
    (v_contact, 'system', 'mentorship', p_event, p_subject, p_body,
     coalesce(p_payload, '{}'::jsonb), coalesce(p_when, now()), p_dedupe)
  on conflict (dedupe_key) do nothing;
end $$;

create or replace function public.crm_member_name(p_member uuid)
returns text language sql stable security definer set search_path = public as $$
  select coalesce(
    (select nullif(trim(full_name), '') from public.profiles where member_id = p_member),
    'a member');
$$;

create or replace function public.crm_lagos_time(p_at timestamptz)
returns text language sql immutable as $$
  select to_char(p_at at time zone 'Africa/Lagos', 'DD Mon YYYY, HH24:MI');
$$;

create or replace function public.crm_money(p_minor bigint, p_currency text)
returns text language sql immutable as $$
  select case p_currency when 'NGN' then '₦' when 'USD' then '$' else p_currency || ' ' end
         || to_char(p_minor / 100.0, 'FM999,999,999,990');
$$;

revoke all on function public.crm_log_member_event(uuid, text, text, text, jsonb, timestamptz, text)
  from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2. Event writers (one per table, shared by trigger and backfill)
-- ----------------------------------------------------------------------------

create or replace function public.crm_booking_event(b public.session_bookings, p_kind text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_when    text := public.crm_lagos_time(b.starts_at);
  v_mentor  text := public.crm_member_name(b.mentor_id);
  v_mentee  text := public.crm_member_name(b.mentee_id);
  v_payload jsonb := jsonb_build_object('booking_id', b.id, 'starts_at', b.starts_at);
  v_at      timestamptz := case when p_kind = 'created' then b.created_at
                                else coalesce(b.decided_at, now()) end;
  v_label   text := case p_kind
                      when 'created'   then 'booked'
                      when 'accepted'  then 'accepted'
                      when 'declined'  then 'declined'
                      when 'cancelled' then 'cancelled'
                      when 'expired'   then 'expired'
                      else p_kind end;
begin
  perform public.crm_log_member_event(
    b.mentee_id, 'session_' || p_kind,
    case when p_kind = 'created' then 'Booked a mentorship session with ' || v_mentor
         else 'Mentorship session ' || v_label || ' (with ' || v_mentor || ')' end,
    v_when || ' · ' || b.duration_minutes || ' minutes',
    v_payload, v_at, 'booking:' || b.id || ':' || p_kind || ':mentee');
  perform public.crm_log_member_event(
    b.mentor_id, 'session_' || p_kind,
    case when p_kind = 'created' then v_mentee || ' booked a session with them'
         else 'Mentorship session ' || v_label || ' (with ' || v_mentee || ')' end,
    v_when || ' · ' || b.duration_minutes || ' minutes',
    v_payload, v_at, 'booking:' || b.id || ':' || p_kind || ':mentor');
end $$;

create or replace function public.crm_payment_event(p public.payments)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p.status = 'success' then
    perform public.crm_log_member_event(
      p.payer_id, 'payment_success',
      'Paid ' || public.crm_money(p.amount, p.currency) || ' for a mentorship '
        || case when p.purpose = 'extension' then 'session extension' else 'session' end,
      'Mentor: ' || public.crm_member_name(p.mentor_id) || ' · Ref ' || coalesce(p.reference, '-'),
      jsonb_build_object('payment_id', p.id, 'amount_minor', p.amount, 'currency', p.currency),
      coalesce(p.paid_at, p.updated_at, now()), 'payment:' || p.id || ':success');
  elsif p.status in ('refunded', 'partially_refunded') then
    perform public.crm_log_member_event(
      p.payer_id, 'payment_refunded',
      case when p.status = 'refunded' then 'Mentorship payment refunded'
           else 'Mentorship payment partly refunded' end,
      'Original payment ' || public.crm_money(p.amount, p.currency),
      jsonb_build_object('payment_id', p.id),
      coalesce(p.refunded_at, p.updated_at, now()), 'payment:' || p.id || ':' || p.status);
  end if;
end $$;

create or replace function public.crm_request_event(r public.mentorship_requests, p_kind text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_mentor text := public.crm_member_name(r.mentor_id);
  v_mentee text := public.crm_member_name(r.mentee_id);
  v_at timestamptz := case when p_kind = 'created' then r.created_at
                           else coalesce(r.decided_at, now()) end;
begin
  perform public.crm_log_member_event(
    r.mentee_id, 'mentorship_request_' || p_kind,
    case when p_kind = 'created' then 'Asked ' || v_mentor || ' to mentor them'
         else 'Mentorship request ' || p_kind || ' (' || v_mentor || ')' end,
    null, jsonb_build_object('request_id', r.id), v_at,
    'request:' || r.id || ':' || p_kind || ':mentee');
  perform public.crm_log_member_event(
    r.mentor_id, 'mentorship_request_' || p_kind,
    case when p_kind = 'created' then v_mentee || ' asked them for mentorship'
         else 'Mentorship request from ' || v_mentee || ' ' || p_kind end,
    null, jsonb_build_object('request_id', r.id), v_at,
    'request:' || r.id || ':' || p_kind || ':mentor');
end $$;

create or replace function public.crm_mentor_event(m public.mentor_profiles, p_new boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.crm_log_member_event(
    m.member_id,
    case when p_new then 'mentor_verified' else 'mentor_level_changed' end,
    case when p_new then 'Became an ETEN mentor (' || m.mentor_status || ')'
         else 'Mentor level is now ' || m.mentor_status end,
    null, jsonb_build_object('mentor_status', m.mentor_status),
    case when p_new then coalesce(m.verified_at, m.created_at) else coalesce(m.updated_at, now()) end,
    case when p_new then 'mentor:' || m.member_id || ':verified'
         else 'mentor:' || m.member_id || ':' || m.mentor_status end);
end $$;

create or replace function public.crm_attendance_event(a public.session_attendance)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_title text;
  v_date  date;
begin
  if not a.attended then return; end if;
  select coalesce(nullif(c.title, ''), 'a mentorship circle'), s.session_date
    into v_title, v_date
    from public.circle_sessions s
    join public.mentorship_circles c on c.id = s.circle_id
   where s.id = a.session_id;
  perform public.crm_log_member_event(
    a.member_id, 'circle_session_attended',
    'Attended a session of ' || coalesce(v_title, 'a mentorship circle'),
    case when v_date is not null then to_char(v_date, 'DD Mon YYYY') end,
    jsonb_build_object('session_id', a.session_id),
    coalesce(v_date::timestamptz, now()),
    'attendance:' || a.session_id || ':' || a.member_id);
end $$;

-- ----------------------------------------------------------------------------
-- 3. Triggers (errors become warnings: Mentorship is never blocked)
-- ----------------------------------------------------------------------------

create or replace function public.crm_on_booking() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  begin
    if tg_op = 'INSERT' then
      perform public.crm_booking_event(new, 'created');
    elsif new.status is distinct from old.status and new.status <> 'pending' then
      perform public.crm_booking_event(new, new.status::text);
    end if;
  exception when others then
    raise warning 'crm booking event failed for %: %', new.id, sqlerrm;
  end;
  return new;
end $$;
drop trigger if exists crm_on_booking on public.session_bookings;
create trigger crm_on_booking after insert or update of status on public.session_bookings
  for each row execute function public.crm_on_booking();

create or replace function public.crm_on_payment() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  begin
    if tg_op = 'INSERT' or new.status is distinct from old.status then
      perform public.crm_payment_event(new);
    end if;
  exception when others then
    raise warning 'crm payment event failed for %: %', new.id, sqlerrm;
  end;
  return new;
end $$;
drop trigger if exists crm_on_payment on public.payments;
create trigger crm_on_payment after insert or update of status on public.payments
  for each row execute function public.crm_on_payment();

create or replace function public.crm_on_request() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  begin
    if tg_op = 'INSERT' then
      perform public.crm_request_event(new, 'created');
    elsif new.status is distinct from old.status and new.status <> 'pending' then
      perform public.crm_request_event(new, new.status::text);
    end if;
  exception when others then
    raise warning 'crm request event failed for %: %', new.id, sqlerrm;
  end;
  return new;
end $$;
drop trigger if exists crm_on_request on public.mentorship_requests;
create trigger crm_on_request after insert or update of status on public.mentorship_requests
  for each row execute function public.crm_on_request();

create or replace function public.crm_on_mentor() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  begin
    if tg_op = 'INSERT' then
      perform public.crm_mentor_event(new, true);
    elsif new.mentor_status is distinct from old.mentor_status then
      perform public.crm_mentor_event(new, false);
    end if;
  exception when others then
    raise warning 'crm mentor event failed for %: %', new.member_id, sqlerrm;
  end;
  return new;
end $$;
drop trigger if exists crm_on_mentor on public.mentor_profiles;
create trigger crm_on_mentor after insert or update of mentor_status on public.mentor_profiles
  for each row execute function public.crm_on_mentor();

create or replace function public.crm_on_attendance() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  begin
    perform public.crm_attendance_event(new);
  exception when others then
    raise warning 'crm attendance event failed for %: %', new.session_id, sqlerrm;
  end;
  return new;
end $$;
drop trigger if exists crm_on_attendance on public.session_attendance;
create trigger crm_on_attendance after insert or update of attended on public.session_attendance
  for each row execute function public.crm_on_attendance();

-- ----------------------------------------------------------------------------
-- 4. Backfill past activity (dedupe keys make this safe to re-run)
-- ----------------------------------------------------------------------------
select public.crm_booking_event(b, 'created') from public.session_bookings b;
select public.crm_booking_event(b, b.status::text)
  from public.session_bookings b where b.status <> 'pending';
select public.crm_payment_event(p) from public.payments p
 where p.status in ('success', 'refunded', 'partially_refunded');
select public.crm_request_event(r, 'created') from public.mentorship_requests r;
select public.crm_request_event(r, r.status::text)
  from public.mentorship_requests r where r.status <> 'pending';
select public.crm_mentor_event(m, true) from public.mentor_profiles m;
select public.crm_attendance_event(a) from public.session_attendance a where a.attended;
