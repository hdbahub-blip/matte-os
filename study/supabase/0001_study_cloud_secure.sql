-- Matte OS Study Cloud v1. Isolated tables in the EXISTING dedicated Matte OS Supabase project.
-- Security: explicit parent-student link, students write their own data, mentors only read after consent.
-- Do not create anonymous access. Cup tables/functions are not modified.
-- Requires extension pgcrypto in "extensions" (verified on the dedicated project).
create table if not exists public.study_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check (role in ('mentor','learner')),
 grade text check ((role='mentor' and grade is null) or (role='learner' and grade in ('grade8','grade9'))),
 display_name text not null default '',
 created_at timestamptz not null default now(),
 constraint study_name_short check (char_length(display_name)<=48)
);
create table if not exists public.study_links (
 learner_id uuid primary key references auth.users(id) on delete cascade,
 mentor_id uuid not null references auth.users(id) on delete cascade,
 grade text not null check (grade in ('grade8','grade9')),
 linked_at timestamptz not null default now(),
 constraint study_distinct_people check (mentor_id<>learner_id)
);
create index if not exists study_links_mentor_idx on public.study_links(mentor_id,grade);
create table if not exists public.study_invites (
 code_hash text primary key check (code_hash ~ '^[0-9a-f]{64}$'),
 mentor_id uuid not null references auth.users(id) on delete cascade,
 grade text not null check (grade in ('grade8','grade9')),
 expires_at timestamptz not null default (now()+interval '48 hours'),
 redeemed_by uuid references auth.users(id),
 issued_at timestamptz not null default now(),
 constraint study_invite_expiry check (expires_at<=issued_at+interval '49 hours')
);
create index if not exists study_invites_mentor_idx on public.study_invites(mentor_id,issued_at desc);
create table if not exists public.study_events (
 event_id uuid primary key,
 learner_id uuid not null references auth.users(id) on delete cascade,
 grade text not null check (grade in ('grade8','grade9')),
 module text not null check (module in ('math','reading','vocab','learning','memory','exam')),
 question_id text not null check (char_length(question_id) between 1 and 200),
 content_version text not null default '',
 question_text text not null default '' check (char_length(question_text)<=3000),
 passage_title text not null default '' check (char_length(passage_title)<=240),
 passage_text text not null default '' check (char_length(passage_text)<=12000),
 answer jsonb not null default '{}'::jsonb check (jsonb_typeof(answer)='object' and pg_column_size(answer)<=9000),
 solution_text text not null default '' check (char_length(solution_text)<=3000),
 is_correct boolean,
 help_used boolean not null default false,
 context jsonb not null default '{}'::jsonb check (jsonb_typeof(context)='object' and pg_column_size(context)<=4000),
 answered_at timestamptz not null default now(),
 received_at timestamptz not null default now(),
 constraint study_events_time_window check (answered_at>='2026-01-01'::timestamptz and answered_at<=received_at+interval '1 day')
);
create index if not exists study_events_student_idx on public.study_events(learner_id,received_at desc,event_id desc);
create table if not exists public.study_snapshots (
 learner_id uuid not null references auth.users(id) on delete cascade,
 grade text not null check (grade in ('grade8','grade9')),
 module text not null check (module in ('math','reading','vocab','learning','memory','exam')),
 device_id uuid not null,
 payload jsonb not null check (jsonb_typeof(payload)='object' and pg_column_size(payload)<=900000),
 updated_at timestamptz not null default now(),
 primary key (learner_id,module,device_id)
);
create index if not exists study_snapshots_student_idx on public.study_snapshots(learner_id,updated_at desc);
create table if not exists public.study_sessions (
 id uuid primary key default gen_random_uuid(),
 mentor_id uuid not null references auth.users(id) on delete cascade,
 learner_id uuid not null references auth.users(id) on delete cascade,
 grade text not null check (grade in ('grade8','grade9')),
 title text not null default 'Studera tillsammans' check (char_length(title)<=160),
 questions jsonb not null check (jsonb_typeof(questions)='array' and jsonb_array_length(questions) between 1 and 12 and pg_column_size(questions)<=60000),
 phase text not null default 'answering' check (phase in ('answering','review','closed')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists study_sessions_learner_idx on public.study_sessions(learner_id,created_at desc);
create index if not exists study_sessions_mentor_idx on public.study_sessions(mentor_id,created_at desc);
create table if not exists public.study_session_answers (
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references public.study_sessions(id) on delete cascade,
 actor_id uuid not null references auth.users(id) on delete cascade,
 question_id text not null check (char_length(question_id) between 1 and 200),
 answer jsonb not null check (jsonb_typeof(answer)='object' and pg_column_size(answer)<=5000),
 submitted_at timestamptz not null default now(),
 unique(session_id,actor_id,question_id)
);
create index if not exists study_session_answers_sid_idx on public.study_session_answers(session_id,submitted_at);
create table if not exists public.study_mentor_practice (
 id uuid primary key default gen_random_uuid(),
 mentor_id uuid not null references auth.users(id) on delete cascade,
 grade text not null check (grade in ('grade8','grade9')),
 question_id text not null,
 answer jsonb not null check (jsonb_typeof(answer)='object' and pg_column_size(answer)<=6000),
 correct boolean,
 created_at timestamptz not null default now()
);
create index if not exists study_mentor_practice_idx on public.study_mentor_practice(mentor_id,created_at desc);

alter table public.study_profiles enable row level security;
alter table public.study_links enable row level security;
alter table public.study_invites enable row level security;
alter table public.study_events enable row level security;
alter table public.study_snapshots enable row level security;
alter table public.study_sessions enable row level security;
alter table public.study_session_answers enable row level security;
alter table public.study_mentor_practice enable row level security;

-- Restrict anonymous/data API access; RLS is an additional independent barrier.
revoke all on public.study_profiles, public.study_links, public.study_invites, public.study_events,
 public.study_snapshots, public.study_sessions, public.study_session_answers, public.study_mentor_practice
 from public, anon, authenticated;
grant select,insert on public.study_profiles to authenticated;
grant select on public.study_links to authenticated;
grant select,insert on public.study_invites to authenticated;
grant select,insert,delete on public.study_events to authenticated;
grant select,insert,delete on public.study_snapshots to authenticated;
grant update(payload,updated_at) on public.study_snapshots to authenticated;
grant select,insert on public.study_sessions to authenticated;
grant update(phase,updated_at) on public.study_sessions to authenticated;
grant select,insert on public.study_session_answers to authenticated;
grant select,insert,delete on public.study_mentor_practice to authenticated;

create policy study_profiles_select on public.study_profiles for select to authenticated using (
 user_id=(select auth.uid()) or exists(
 select 1 from public.study_links l where
 (l.mentor_id=(select auth.uid()) and l.learner_id=study_profiles.user_id)
 or (l.learner_id=(select auth.uid()) and l.mentor_id=study_profiles.user_id))
);
create policy study_profiles_create on public.study_profiles for insert to authenticated with check (user_id=(select auth.uid()));
-- Profile role and grade immutable. No update/delete from client.

create policy study_links_read on public.study_links for select to authenticated using (
 mentor_id=(select auth.uid()) or learner_id=(select auth.uid())
);
-- Links are created/revoked by verified RPC, never a frontend INSERT.
create policy study_invite_read on public.study_invites for select to authenticated using (mentor_id=(select auth.uid()));
create policy study_invite_create on public.study_invites for insert to authenticated with check (
 mentor_id=(select auth.uid()) and redeemed_by is null
 and expires_at>now() and expires_at<=now()+interval '48 hours'
 and exists(select 1 from public.study_profiles p where p.user_id=(select auth.uid()) and p.role='mentor')
);

create policy study_events_read on public.study_events for select to authenticated using (
 learner_id=(select auth.uid()) or exists(
 select 1 from public.study_links l where l.learner_id=study_events.learner_id and l.mentor_id=(select auth.uid()))
);
create policy study_events_insert on public.study_events for insert to authenticated with check (
 learner_id=(select auth.uid()) and exists(
 select 1 from public.study_profiles p where p.user_id=(select auth.uid()) and p.role='learner' and p.grade=study_events.grade)
);
create policy study_events_delete on public.study_events for delete to authenticated using (learner_id=(select auth.uid()));

create policy study_snapshots_read on public.study_snapshots for select to authenticated using (
 learner_id=(select auth.uid()) or exists(
 select 1 from public.study_links l where l.learner_id=study_snapshots.learner_id and l.mentor_id=(select auth.uid()))
);
create policy study_snapshots_insert on public.study_snapshots for insert to authenticated with check (
 learner_id=(select auth.uid()) and exists(
 select 1 from public.study_profiles p where p.user_id=(select auth.uid()) and p.role='learner' and p.grade=study_snapshots.grade)
);
create policy study_snapshots_update on public.study_snapshots for update to authenticated using (
 learner_id=(select auth.uid())
) with check (
 learner_id=(select auth.uid()) and exists (
 select 1 from public.study_profiles p where p.user_id=(select auth.uid()) and p.grade=study_snapshots.grade and p.role='learner')
);
create policy study_snapshots_delete on public.study_snapshots for delete to authenticated using (learner_id=(select auth.uid()));

create policy study_sessions_read on public.study_sessions for select to authenticated using (
 mentor_id=(select auth.uid()) or learner_id=(select auth.uid())
);
create policy study_sessions_insert on public.study_sessions for insert to authenticated with check (
 mentor_id=(select auth.uid()) and phase='answering' and exists(
 select 1 from public.study_links l where l.mentor_id=(select auth.uid())
 and l.learner_id=study_sessions.learner_id and l.grade=study_sessions.grade)
);
create policy study_sessions_update on public.study_sessions for update to authenticated using (
 mentor_id=(select auth.uid())
) with check (mentor_id=(select auth.uid()));

create policy study_session_answers_read on public.study_session_answers for select to authenticated using (
 actor_id=(select auth.uid()) or exists (
 select 1 from public.study_sessions s where s.id=study_session_answers.session_id and
 (s.mentor_id=(select auth.uid()) or s.learner_id=(select auth.uid()))
 and s.phase in ('review','closed'))
);
create policy study_session_answers_insert on public.study_session_answers for insert to authenticated with check (
 actor_id=(select auth.uid()) and exists(
 select 1 from public.study_sessions s where s.id=study_session_answers.session_id and s.phase='answering'
 and (s.mentor_id=(select auth.uid()) or s.learner_id=(select auth.uid()))
 and exists (select 1 from jsonb_array_elements(s.questions) q where q->>'id'=study_session_answers.question_id))
);
create policy study_mentor_practice_read on public.study_mentor_practice for select to authenticated using (
 mentor_id=(select auth.uid())
);
create policy study_mentor_practice_insert on public.study_mentor_practice for insert to authenticated with check (
 mentor_id=(select auth.uid()) and exists (select 1 from public.study_profiles p where p.user_id=(select auth.uid()) and p.role='mentor')
);
create policy study_mentor_practice_delete on public.study_mentor_practice for delete to authenticated using (
 mentor_id=(select auth.uid())
);

-- Explicit, narrowly scoped invite redemption. Authentication and role checks are SERVER-side.
-- Full 128-bit random code, 48-hour expiry, single learner, row lock prevents double redemption.
create or replace function public.study_redeem_invite(p_code text)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid());
v_role text; v_grade text; v_inv public.study_invites%rowtype; v_existing uuid;
begin
 if v_me is null or p_code !~ '^[0-9A-Fa-f]{32}$' then return false; end if;
 select role,grade into v_role,v_grade from public.study_profiles where user_id=v_me;
 if v_role is distinct from 'learner' then return false; end if;
 select * into v_inv from public.study_invites
 where code_hash=encode(extensions.digest(lower(p_code),'sha256'),'hex') and redeemed_by is null
 and expires_at>now() for update;
 if not found or v_inv.grade is distinct from v_grade then return false; end if;
 if not exists(select 1 from public.study_profiles where user_id=v_inv.mentor_id and role='mentor') then return false; end if;
 select mentor_id into v_existing from public.study_links where learner_id=v_me;
 if v_existing is not null then return false; end if;
 insert into public.study_links(learner_id,mentor_id,grade) values(v_me,v_inv.mentor_id,v_grade);
 update public.study_invites set redeemed_by=v_me where code_hash=v_inv.code_hash;
 return true;
exception when unique_violation then return false;
end $$;
revoke all on function public.study_redeem_invite(text) from public,anon,authenticated;
grant execute on function public.study_redeem_invite(text) to authenticated;

-- Either party can revoke sharing. This immediately blocks future parent SELECT under RLS.
create or replace function public.study_unlink(p_learner uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid());v_count integer;
begin
 if v_me is null then return false;end if;
 delete from public.study_links where learner_id=p_learner
 and (mentor_id=v_me or learner_id=v_me);
 get diagnostics v_count=row_count;
 return v_count=1;
end $$;
revoke all on function public.study_unlink(uuid) from public,anon,authenticated;
grant execute on function public.study_unlink(uuid) to authenticated;

-- Table changes can be delivered to authorized clients through Supabase Postgres Changes.
-- No raw anonymous channels are used; each event is filtered again by RLS.
alter publication supabase_realtime add table public.study_events;
alter publication supabase_realtime add table public.study_snapshots;
alter publication supabase_realtime add table public.study_sessions;
alter publication supabase_realtime add table public.study_session_answers;
