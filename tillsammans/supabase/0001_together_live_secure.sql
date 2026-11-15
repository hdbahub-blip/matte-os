-- Matte OS Together Live v1 — STAGING ONLY. Do not deploy without RLS/security acceptance.
-- Authenticated Study Cloud identities only; NO anonymous RPC/data access.
-- Private room data never appears via table REST or Postgres Changes.
-- Room content is authored on the host device; server validates shape and owns scores.
-- Requires existing public.study_profiles, auth.uid(), and pgcrypto in extensions.
create schema if not exists together_live;
revoke all on schema together_live from public, anon, authenticated;

create table together_live.rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  join_hash text not null unique check (join_hash ~ '^[0-9a-f]{64}$'),
  content_ref text not null check (content_ref ~ '^(sv|en|study|math|table):[a-zA-Z0-9_-]{1,64}(:v[0-9]{1,3})?$'),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  deck jsonb not null check (jsonb_typeof(deck)='array' and jsonb_array_length(deck) between 1 and 12 and pg_column_size(deck)<35000),
  phase text not null default 'lobby' check (phase in ('lobby','answering','reveal','done')),
  idx integer not null default 0 check (idx between 0 and 11),
  revision integer not null default 0 check (revision>=0),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now()+interval '4 hours'),
  check (expires_at <= created_at + interval '4 hours')
);
create index together_live_rooms_owner_idx on together_live.rooms(owner_id,expires_at);
create table together_live.members (
  room_id uuid not null references together_live.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  alias text not null check (char_length(alias) between 1 and 24 and alias !~ '[[:cntrl:]]'),
  joined_at timestamptz not null default now(),
  primary key (room_id,user_id)
);
create table together_live.answers (
  room_id uuid not null,
  user_id uuid not null,
  round integer not null check (round between 0 and 11),
  choice integer not null check (choice between 0 and 7),
  answered_at timestamptz not null default now(),
  primary key (room_id,round,user_id),
  foreign key (room_id,user_id) references together_live.members(room_id,user_id) on delete cascade
);
create table together_live.throttle (
  user_id uuid not null,
  action text not null,
  window_start timestamptz not null,
  attempts integer not null check (attempts between 1 and 1000000),
  primary key (user_id,action)
);
alter table together_live.rooms enable row level security;
alter table together_live.members enable row level security;
alter table together_live.answers enable row level security;
alter table together_live.throttle enable row level security;
revoke all on all tables in schema together_live from public, anon, authenticated;
revoke all on all sequences in schema together_live from public, anon, authenticated;

create function together_live.identity() returns uuid
language plpgsql stable set search_path='' as $$
declare v_uid uuid := (select auth.uid());
begin
 if v_uid is null or not exists(select 1 from public.study_profiles p join auth.users u on u.id=p.user_id
    where p.user_id=v_uid and u.is_anonymous is false) then
   raise exception 'NOT_MEMBER' using errcode='P0001';
 end if;
 return v_uid;
end $$;
create function together_live.rate(p_uid uuid,p_action text,p_max integer,p_window_seconds integer)
returns void language plpgsql set search_path='' as $$
declare v_count integer; v_time timestamptz := clock_timestamp();
begin
 insert into together_live.throttle(user_id,action,window_start,attempts)
 values(p_uid,p_action,v_time,1)
 on conflict(user_id,action) do update set
 attempts=case when together_live.throttle.window_start<v_time-make_interval(secs=>p_window_seconds) then 1 else together_live.throttle.attempts+1 end,
 window_start=case when together_live.throttle.window_start<v_time-make_interval(secs=>p_window_seconds) then v_time else together_live.throttle.window_start end
 returning attempts into v_count;
 if v_count>p_max then raise exception 'RATE_LIMIT' using errcode='P0001'; end if;
end $$;
create function together_live.check_alias(p_alias text) returns text
language plpgsql immutable set search_path='' as $$
declare v_alias text := btrim(coalesce(p_alias,''));
begin
 if char_length(v_alias) not between 1 and 24 or v_alias ~ '[[:cntrl:]]'
 then raise exception 'INVALID_ALIAS' using errcode='P0001'; end if;
 return v_alias;
end $$;
create function together_live.validate_deck(p_deck jsonb) returns void
language plpgsql set search_path='' as $$
declare q jsonb; option jsonb; options jsonb; v_ans text;
begin
 if p_deck is null or jsonb_typeof(p_deck)<>'array' or jsonb_array_length(p_deck) not between 1 and 12
 or pg_column_size(p_deck)>35000 then raise exception 'INVALID_DECK' using errcode='P0001'; end if;
 for q in select value from jsonb_array_elements(p_deck) loop
   options := q->'options'; v_ans := q->>'correct';
   if jsonb_typeof(q)<>'object' or jsonb_typeof(options)<>'array'
   or jsonb_array_length(options) not between 2 and 8
   or jsonb_typeof(q->'prompt')<>'string'
   or char_length(q->>'prompt') not between 1 and 800
   or jsonb_typeof(q->'correct')<>'number' or v_ans is null or v_ans !~ '^[0-7]$' or v_ans::int>=jsonb_array_length(options)
   or char_length(coalesce(q->>'why',''))>1500
   or char_length(coalesce(q->>'key',''))>120 then raise exception 'INVALID_QUESTION' using errcode='P0001'; end if;
   for option in select value from jsonb_array_elements(options) loop
     if jsonb_typeof(option)<>'string' or char_length(option#>>'{}') not between 1 and 400
     then raise exception 'INVALID_OPTION' using errcode='P0001'; end if;
   end loop;
 end loop;
end $$;

create function public.together_live_create(p_ref text,p_deck jsonb,p_alias text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid; v_code text; v_room uuid; v_hash text;
begin
 v_user:=together_live.identity();
 perform together_live.rate(v_user,'create',3,60);
 -- The throttle insert must commit EVEN for rejected payloads.
 -- Catch validation errors in a nested subtransaction; return an error object.
 begin
 if p_ref is null or p_ref !~ '^(sv|en|study|math|table):[a-zA-Z0-9_-]{1,64}(:v[0-9]{1,3})?$'
 then raise exception 'INVALID_SOURCE' using errcode='P0001'; end if;
 perform together_live.validate_deck(p_deck);
 perform together_live.check_alias(p_alias);
 -- Opportunistic cleanup; a scheduled cleanup remains a production prerequisite.
 delete from together_live.rooms where expires_at<=now();
 if (select count(*) from together_live.rooms where owner_id=v_user and expires_at>now())>=3
 then raise exception 'ROOM_LIMIT' using errcode='P0001'; end if;
 v_code:=encode(extensions.gen_random_bytes(16),'hex');
 v_hash:=encode(extensions.digest(p_deck::text,'sha256'),'hex');
 insert into together_live.rooms(owner_id,join_hash,content_ref,content_hash,deck)
 values(v_user,encode(extensions.digest(v_code,'sha256'),'hex'),p_ref,v_hash,p_deck) returning id into v_room;
 insert into together_live.members(room_id,user_id,alias) values(v_room,v_user,btrim(p_alias));
 return jsonb_build_object('room_id',v_room,'invite',v_code,'expires_in_minutes',240);
 exception when sqlstate 'P0001' then
   return jsonb_build_object('error',sqlerrm);
 end;
end $$;

create function public.together_live_join(p_invite text,p_alias text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid; r together_live.rooms%rowtype; v_n integer;
begin
 v_user:=together_live.identity();
 perform together_live.rate(v_user,'join',15,60);
 -- Invalid invites must consume their allowance, not rollback the throttle row.
 begin
 if p_invite is null or p_invite !~ '^[0-9a-fA-F]{32}$' then
 raise exception 'INVALID_INVITE' using errcode='P0001'; end if;
 perform together_live.check_alias(p_alias);
 select * into r from together_live.rooms
 where join_hash=encode(extensions.digest(lower(p_invite),'sha256'),'hex') and expires_at>now()
 for update;
 if not found or r.phase<>'lobby' then raise exception 'INVALID_INVITE' using errcode='P0001'; end if;
 if not exists(select 1 from together_live.members where room_id=r.id and user_id=v_user) then
   select count(*) into v_n from together_live.members where room_id=r.id;
   if v_n>=10 then raise exception 'ROOM_FULL' using errcode='P0001'; end if;
   insert into together_live.members(room_id,user_id,alias) values(r.id,v_user,btrim(p_alias));
   update together_live.rooms set revision=revision+1 where id=r.id;
 end if;
 return jsonb_build_object('room_id',r.id);
 exception when sqlstate 'P0001' then
   return jsonb_build_object('error',sqlerrm);
 end;
end $$;

create function public.together_live_state(p_room uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid; r together_live.rooms%rowtype; v_members jsonb; v_q jsonb; v_answers jsonb := '[]'::jsonb;
begin
 v_user:=together_live.identity();
 select * into r from together_live.rooms where id=p_room and expires_at>now();
 if not found or not exists(select 1 from together_live.members where room_id=p_room and user_id=v_user)
 then raise exception 'NOT_FOUND' using errcode='P0001'; end if;
 select coalesce(jsonb_agg(jsonb_build_object(
 'id',m.user_id,'name',m.alias,
 'score',(select count(*)::int from together_live.answers a
           where a.room_id=m.room_id and a.user_id=m.user_id
           and (a.round<r.idx or r.phase in ('reveal','done')) and a.choice=(r.deck->a.round->>'correct')::int)
 ) order by m.joined_at,m.user_id),'[]'::jsonb) into v_members
 from together_live.members m where m.room_id=p_room;
 v_q:=r.deck->r.idx;
 if r.phase in ('lobby','answering') then
   v_q:=v_q-'correct'-'why';
 else
   select coalesce(jsonb_agg(jsonb_build_object('id',a.user_id,'choice',a.choice)
                       order by a.answered_at,a.user_id),'[]'::jsonb)
   into v_answers from together_live.answers a where a.room_id=p_room and a.round=r.idx;
 end if;
 return jsonb_build_object('room_id',r.id,'owner_id',r.owner_id,'me',v_user,
 'phase',r.phase,'round',r.idx,'total',jsonb_array_length(r.deck),
 'revision',r.revision,'members',v_members,'question',v_q,
 'answer_count',(select count(*) from together_live.answers a where a.room_id=r.id and a.round=r.idx),
 'my_answered',exists(select 1 from together_live.answers a where a.room_id=r.id and a.round=r.idx and a.user_id=v_user),
 'answers',v_answers,'expires_at',r.expires_at,'content_ref',r.content_ref);
end $$;

create function public.together_live_start(p_room uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid; r together_live.rooms%rowtype;
begin
 v_user:=together_live.identity();
 select * into r from together_live.rooms where id=p_room and expires_at>now() for update;
 if not found or r.owner_id<>v_user or r.phase<>'lobby' then return false; end if;
 update together_live.rooms set phase='answering',revision=revision+1 where id=p_room;
 return true;
end $$;

create function public.together_live_answer(p_room uuid,p_round integer,p_choice integer)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid; r together_live.rooms%rowtype; v_previous integer; v_members integer; v_answered integer;
begin
 v_user:=together_live.identity();
 perform together_live.rate(v_user,'answer',60,60);
 select * into r from together_live.rooms where id=p_room and expires_at>now() for update;
 if not found or r.phase<>'answering' or p_round is distinct from r.idx
 or not exists(select 1 from together_live.members where room_id=p_room and user_id=v_user)
 or p_choice is null or p_choice<0 or p_choice>=jsonb_array_length(r.deck->r.idx->'options')
 then return false; end if;
 select choice into v_previous from together_live.answers where room_id=p_room and round=p_round and user_id=v_user;
 if found then return v_previous=p_choice; end if; -- idempotent only for identical retry
 insert into together_live.answers(room_id,user_id,round,choice) values(p_room,v_user,r.idx,p_choice);
 select count(*) into v_members from together_live.members where room_id=p_room;
 select count(*) into v_answered from together_live.answers where room_id=p_room and round=r.idx;
 update together_live.rooms set phase=case when v_members=v_answered then 'reveal' else phase end,revision=revision+1 where id=p_room;
 return true;
end $$;

create function public.together_live_next(p_room uuid,p_expected_round integer)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid; r together_live.rooms%rowtype;
begin
 v_user:=together_live.identity();
 select * into r from together_live.rooms where id=p_room and expires_at>now() for update;
 if not found or r.owner_id<>v_user or r.phase<>'reveal' or p_expected_round is distinct from r.idx
 then return false; end if;
 if r.idx+1>=jsonb_array_length(r.deck) then
   update together_live.rooms set phase='done',revision=revision+1 where id=p_room;
 else
   update together_live.rooms set phase='answering',idx=idx+1,revision=revision+1 where id=p_room;
 end if;
 return true;
end $$;

create function public.together_live_leave(p_room uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid; r together_live.rooms%rowtype;
begin
 v_user:=together_live.identity();
 select * into r from together_live.rooms where id=p_room and expires_at>now() for update;
 if not found then return false; end if;
 if r.owner_id=v_user then delete from together_live.rooms where id=p_room; return true; end if;
 if not exists(select 1 from together_live.members where room_id=p_room and user_id=v_user) then return false; end if;
 delete from together_live.members where room_id=p_room and user_id=v_user;
 if r.phase='answering' and (select count(*) from together_live.members where room_id=p_room)>0
   and (select count(*) from together_live.answers where room_id=p_room and round=r.idx)
    =(select count(*) from together_live.members where room_id=p_room)
 then update together_live.rooms set phase='reveal',revision=revision+1 where id=p_room;
 else update together_live.rooms set revision=revision+1 where id=p_room; end if;
 return true;
end $$;
-- No default EXECUTE. No anonymous access, including function overloads.
revoke all on function public.together_live_create(text,jsonb,text) from public,anon,authenticated;
revoke all on function public.together_live_join(text,text) from public,anon,authenticated;
revoke all on function public.together_live_state(uuid) from public,anon,authenticated;
revoke all on function public.together_live_start(uuid) from public,anon,authenticated;
revoke all on function public.together_live_answer(uuid,integer,integer) from public,anon,authenticated;
revoke all on function public.together_live_next(uuid,integer) from public,anon,authenticated;
revoke all on function public.together_live_leave(uuid) from public,anon,authenticated;
grant execute on function public.together_live_create(text,jsonb,text) to authenticated;
grant execute on function public.together_live_join(text,text) to authenticated;
grant execute on function public.together_live_state(uuid) to authenticated;
grant execute on function public.together_live_start(uuid) to authenticated;
grant execute on function public.together_live_answer(uuid,integer,integer) to authenticated;
grant execute on function public.together_live_next(uuid,integer) to authenticated;
grant execute on function public.together_live_leave(uuid) to authenticated;
-- Internal housekeeping. Schedule using Supabase Cron after deployment and verify each run.
-- Not public RPC; cascading delete removes members and all answers.
create function together_live.prune_expired() returns integer
language plpgsql set search_path='' as $$
declare v_removed integer;
begin
 delete from together_live.rooms where expires_at<=now();
 get diagnostics v_removed = row_count;
 delete from together_live.throttle where window_start<now()-interval '2 hours';
 return v_removed;
end $$;
revoke all on all functions in schema together_live from public,anon,authenticated;
-- Purely local SQL staging: no writes to real Supabase in this migration file.
