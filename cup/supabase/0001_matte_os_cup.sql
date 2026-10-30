-- Matte OS Cup · spelmotor (Postgres). Körs som EN migration i ett DEDIKERAT Supabase-projekt.
-- Princip: inga tabeller exponeras. Allt går via SECURITY DEFINER-funktioner (RPC) i schema public
-- som validerar rumskod + spelarhemlighet/värdhemlighet. Schema "cup" har inga rättigheter för anon/authenticated.
-- Facit lämnar aldrig servern innan spelaren besvarat frågan / rundan är slut.

create schema if not exists cup;
revoke all on schema cup from public;

create table cup.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_hash text not null,
  status text not null default 'LOBBY' check (status in ('LOBBY','ACTIVE','SCORED','COMPLETE','CANCELLED')),
  stage text not null default 'lobby' check (stage in ('lobby','qual','semi','final','done')),
  tables int[] not null,
  qual_q int not null check (qual_q between 5 and 30),
  sec_per_q int not null check (sec_per_q between 5 and 60),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '6 hours'
);
create table cup.players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references cup.rooms(id) on delete cascade,
  seq bigint generated always as identity,
  nick text not null,
  nick_key text not null,
  device text not null,
  secret_hash text not null,
  ready boolean not null default false,
  kicked boolean not null default false,
  joined_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  last_poll timestamptz,
  unique (room_id, nick_key)
);
create index players_room_device_idx on cup.players(room_id, device);
create table cup.rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references cup.rooms(id) on delete cascade,
  no int not null,
  stage text not null,
  kind text not null check (kind in ('main','tb')),
  game int not null default 1,
  n_q int not null,
  starts_at timestamptz not null,
  deadline timestamptz not null,
  status text not null default 'active' check (status in ('active','done')),
  unique (room_id, no)
);
create table cup.round_players (
  round_id uuid not null references cup.rounds(id) on delete cascade,
  player_id uuid not null references cup.players(id) on delete cascade,
  grp int not null default 0,
  primary key (round_id, player_id)
);
create table cup.questions (
  round_id uuid not null references cup.rounds(id) on delete cascade,
  idx int not null,
  a int not null check (a between 1 and 10),
  b int not null check (b between 1 and 10),
  ans int not null,
  primary key (round_id, idx)
);
create table cup.answers (
  round_id uuid not null,
  player_id uuid not null,
  idx int not null,
  val int not null,
  correct boolean not null,
  at timestamptz not null default now(),
  primary key (round_id, player_id, idx),
  foreign key (round_id, player_id) references cup.round_players(round_id, player_id) on delete cascade
);
-- begränsning av missbruk: en rad per (åtgärd, nyckel); fönstret rullar. Rensas i cup_create.
create table cup.rate (
  bucket text primary key,
  win bigint not null,
  n int not null,
  until_at timestamptz not null
);
alter table cup.rate enable row level security;
-- driftinställningar (läses bara av definer-funktioner): ip_salt (slumpad per databas), xff_from_right ('1' = sista x-forwarded-for,
-- '2' = näst sista, '0' = första), ip_mode ('auto' | 'off'). Se docs/MATTE_OS_CUP_SUPABASE_PLAN.md.
create table cup.settings (key text primary key, val text not null);
alter table cup.settings enable row level security;
insert into cup.settings(key, val) values ('ip_salt', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')), ('xff_from_right', '1'), ('ip_mode', 'auto');
alter table cup.rooms enable row level security;
alter table cup.players enable row level security;
alter table cup.rounds enable row level security;
alter table cup.round_players enable row level security;
alter table cup.questions enable row level security;
alter table cup.answers enable row level security;

-- ---------- hjälpare ----------
create function cup.err(code text, msg text) returns void language plpgsql as $$
begin raise exception '%: %', code, msg using errcode = 'P0001'; end $$;

-- Klientnyckel för begränsning: hash av IP (aldrig rå IP lagrad). Supabase/PostgREST lägger begäranshuvuden i GUC request.headers.
-- cf-connecting-ip sätts av Supabases edge; annars används SISTA x-forwarded-for-värdet (det närmaste proxy la till).
-- Saknas båda (direkt SQL/test) returneras null och per-klient-gränser hoppas över; globala gränser gäller alltid.
create function cup.setting(k text) returns text language sql stable as $$ select val from cup.settings where key = k $$;

create function cup.client_key() returns text language plpgsql stable as $$
declare h jsonb; ip text; parts text[]; n int; k int;
begin
  if cup.setting('ip_mode') = 'off' then return null; end if;
  begin h := nullif(current_setting('request.headers', true), '')::jsonb; exception when others then h := null; end;
  if h is null then return null; end if;
  -- 1) cf-connecting-ip: sätts av Cloudflare framför Supabase och skrivs över om klienten skickar det.
  ip := nullif(trim(coalesce(h->>'cf-connecting-ip', '')), '');
  -- 2) annars x-forwarded-for räknat från HÖGER (xff_from_right). En klient kan skicka eget x-forwarded-for; proxyn lägger sin
  --    observation sist, så första värdet är förfalskningsbart. Vänster värde (0) finns bara som medvetet val.
  if ip is null then
    parts := regexp_split_to_array(coalesce(h->>'x-forwarded-for', ''), '\s*,\s*'); n := coalesce(array_length(parts, 1), 0);
    k := coalesce(nullif(cup.setting('xff_from_right'), '')::int, 1);
    if n > 0 then ip := nullif(trim(case when k = 0 then parts[1] else parts[greatest(1, n - k + 1)] end), ''); end if;
  end if;
  if ip is null then return null; end if;
  return substr(encode(sha256(convert_to(cup.setting('ip_salt') || ip, 'utf8')), 'hex'), 1, 16);
end $$;

create function cup.throttle(p_action text, p_key text, p_max int, p_secs int) returns void language plpgsql as $$
declare w bigint := floor(extract(epoch from now()) / p_secs); c int;
begin
  insert into cup.rate(bucket, win, n, until_at) values (p_action || ':' || p_key, w, 1, now() + make_interval(secs => p_secs * 2))
  on conflict (bucket) do update
    set n = case when cup.rate.win = excluded.win then cup.rate.n + 1 else 1 end, win = excluded.win, until_at = excluded.until_at
  returning n into c;
  if c > p_max then perform cup.err('RATE', 'För många försök på kort tid. Vänta en stund.'); end if;
end $$;

create function cup.hash(t text) returns text language sql immutable as
$$ select encode(sha256(convert_to(t, 'utf8')), 'hex') $$;

create function cup.newtoken() returns text language sql as
$$ select replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '') $$;

create function cup.get_room(p_code text, p_lock boolean default false) returns cup.rooms language plpgsql as $$
declare r cup.rooms;
begin
  if p_lock then select * into r from cup.rooms where code = upper(trim(p_code)) for update;
  else select * into r from cup.rooms where code = upper(trim(p_code)); end if;
  if not found then perform cup.err('NO_ROOM', 'Rummet finns inte (kontrollera koden).'); end if;
  if r.expires_at < now() or r.status = 'CANCELLED' then perform cup.err('GONE', 'Spelet är avslutat.'); end if;
  return r;
end $$;

create function cup.auth_host(r cup.rooms, p_secret text) returns void language plpgsql as $$
begin
  if p_secret is null or cup.hash(p_secret) <> r.host_hash then perform cup.err('NOT_HOST', 'Bara värden kan göra detta.'); end if;
end $$;

create function cup.auth_player(r cup.rooms, p_id uuid, p_secret text) returns cup.players language plpgsql as $$
declare p cup.players;
begin
  select * into p from cup.players where id = p_id and room_id = r.id;
  if not found or p_secret is null or cup.hash(p_secret) <> p.secret_hash then perform cup.err('BAD_PLAYER', 'Spelaren känns inte igen.'); end if;
  if p.kicked then perform cup.err('KICKED', 'Du har tagits bort från spelet.'); end if;
  update cup.players set last_seen = now() where id = p.id;
  return p;
end $$;

-- poäng per spelare i en runda (endast svar före slutet räknas)
create function cup.round_scores(p_round uuid)
returns table (player_id uuid, grp int, correct int, answered int) language sql stable as $$
  select rp.player_id, rp.grp,
         (count(a.idx) filter (where a.correct and a.at <= r.deadline))::int,
         (count(a.idx) filter (where a.at <= r.deadline))::int
  from cup.round_players rp
  join cup.rounds r on r.id = rp.round_id
  left join cup.answers a on a.round_id = rp.round_id and a.player_id = rp.player_id
  where rp.round_id = p_round
  group by rp.player_id, rp.grp
$$;

create function cup.gen_questions(p_round uuid, p_n int, p_tables int[]) returns void language plpgsql as $$
declare i int := 0; rec record;
begin
  while i < p_n loop
    -- slumpad ordning av unika (oordnade) par; fyll på med nytt varv om fler frågor än par
    for rec in
      select a, b from (
        select distinct on (least(a, b), greatest(a, b)) a, b from (
          select t as a, g as b from unnest(p_tables) t cross join generate_series(1, 10) g
        ) s order by least(a, b), greatest(a, b), random()
      ) u order by random()
    loop
      exit when i >= p_n;
      insert into cup.questions(round_id, idx, a, b, ans) values (p_round, i, rec.a, rec.b, rec.a * rec.b);
      i := i + 1;
    end loop;
  end loop;
end $$;

create function cup.mk_round(r cup.rooms, p_stage text, p_kind text, p_game int, p_n int, p_players uuid[], p_grps int[])
returns uuid language plpgsql as $$
declare rid uuid := gen_random_uuid(); nxt int; k int;
begin
  select coalesce(max(no), 0) + 1 into nxt from cup.rounds where room_id = r.id;
  insert into cup.rounds(id, room_id, no, stage, kind, game, n_q, starts_at, deadline)
  values (rid, r.id, nxt, p_stage, p_kind, p_game, p_n,
          now() + interval '6 seconds',
          now() + interval '6 seconds' + make_interval(secs => p_n * r.sec_per_q + 5));
  for k in 1 .. coalesce(array_length(p_players, 1), 0) loop
    insert into cup.round_players(round_id, player_id, grp) values (rid, p_players[k], p_grps[k]);
  end loop;
  perform cup.gen_questions(rid, p_n, r.tables);
  update cup.rooms set status = 'ACTIVE', stage = p_stage where id = r.id;
  return rid;
end $$;

-- stänger aktiv runda när tiden gått ut eller alla svarat på allt
create function cup.tick(p_room uuid) returns void language plpgsql as $$
declare rd cup.rounds; open_cnt int;
begin
  select * into rd from cup.rounds where room_id = p_room and status = 'active' order by no desc limit 1;
  if not found then return; end if;
  select count(*) into open_cnt from cup.round_players rp
   where rp.round_id = rd.id
     and (select count(*) from cup.answers a where a.round_id = rd.id and a.player_id = rp.player_id) < rd.n_q;
  if now() >= rd.deadline or (open_cnt = 0 and now() >= rd.starts_at) then
    update cup.rounds set status = 'done', deadline = least(deadline, now()) where id = rd.id and status = 'active';
    update cup.rooms set status = 'SCORED' where id = p_room and status = 'ACTIVE';
  end if;
end $$;

-- ---------- publika RPC ----------
create function cup.impl_create(p_tables int[] default null, p_qual_q int default 10, p_sec_per_q int default 20)
returns jsonb language plpgsql set search_path = '' as $$
declare alpha text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; c text; tries int := 0; secret text; tabs int[];
begin
  delete from cup.rooms where expires_at < now();
  delete from cup.rate where until_at < now();
  if cup.client_key() is not null then perform cup.throttle('create', cup.client_key(), 6, 600); end if;
  if (select count(*) from cup.rooms where created_at > now() - interval '1 minute') >= 30 then
    perform cup.err('BUSY', 'För många nya spel just nu. Vänta en minut.');
  end if;
  if (select count(*) from cup.rooms) >= 200 then perform cup.err('BUSY', 'Servern är full just nu.'); end if;
  select coalesce(array_agg(distinct t order by t), array[1,2,3,4,5,6,7,8,9,10]) into tabs
    from unnest(coalesce(p_tables, array[1,2,3,4,5,6,7,8,9,10])) t where t between 1 and 10;
  if array_length(tabs, 1) is null then tabs := array[1,2,3,4,5,6,7,8,9,10]; end if;
  secret := cup.newtoken();
  loop
    c := '';
    for i in 1 .. 5 loop c := c || substr(alpha, 1 + floor(random() * length(alpha))::int, 1); end loop;
    begin
      insert into cup.rooms(code, host_hash, tables, qual_q, sec_per_q)
      values (c, cup.hash(secret), tabs, greatest(5, least(30, p_qual_q)), greatest(5, least(60, p_sec_per_q)));
      exit;
    exception when unique_violation then
      tries := tries + 1; if tries > 20 then raise; end if;
    end;
  end loop;
  return jsonb_build_object('code', c, 'host_secret', secret);
end $$;

create function cup.impl_join(p_code text, p_nick text, p_device text)
returns jsonb language plpgsql set search_path = '' as $$
declare r cup.rooms; v_nick text; base text; n int := 1; secret text := cup.newtoken(); p cup.players; cnt int; k text := cup.client_key();
begin
  -- Begränsa först (före alla fel), så att försök med fel kod också räknas. Okänd kod returneras som {error} i stället för
  -- exception, annars rullas räknaren tillbaka och koduppräkning vore gratis.
  if k is not null then perform cup.throttle('join', k, 80, 60); end if;
  perform cup.throttle('join', 'all', 600, 60);
  begin
    r := cup.get_room(p_code, true);
  exception when sqlstate 'P0001' then
    return jsonb_build_object('error', sqlerrm);
  end;
  perform cup.throttle('joinroom', r.id::text, 150, 60);
  if p_device is null or length(p_device) < 8 or length(p_device) > 80 then perform cup.err('BAD_DEVICE', 'Ogiltig enhet.'); end if;
  base := regexp_replace(trim(coalesce(p_nick, '')), '\s+', ' ', 'g');
  if length(base) < 1 or length(base) > 16 then perform cup.err('BAD_NICK', 'Smeknamnet ska vara 1–16 tecken.'); end if;
  if base !~ '^[[:alpha:][:digit:] ._!-]+$' then perform cup.err('BAD_NICK', 'Använd bara bokstäver, siffror, mellanslag, punkt, bindestreck eller understreck.'); end if;
  -- Ingen återanslutning på enhets-id: enhets-id är inte en hemlighet och får aldrig ge åtkomst till en befintlig plats.
  -- En plats nås bara med (player_id, secret) som klienten fick vid anslutningen och sparar lokalt.
  if exists (select 1 from cup.players where room_id = r.id and device = p_device and kicked) then perform cup.err('KICKED', 'Du har tagits bort från spelet.'); end if;
  if r.status <> 'LOBBY' then perform cup.err('STARTED', 'Spelet har redan startat. Be värden om ett nytt spel.'); end if;
  select count(*) into cnt from cup.players where room_id = r.id and not kicked;
  if cnt >= 24 then perform cup.err('FULL', 'Spelet är fullt (högst 24 spelare).'); end if;
  if (select count(*) from cup.players where room_id = r.id) >= 40 then perform cup.err('FULL', 'Spelet är fullt.'); end if;
  if (select count(*) from cup.players where room_id = r.id and device = p_device and not kicked) >= 3 then perform cup.err('FULL', 'Den här enheten har redan flera platser i spelet.'); end if;
  v_nick := base;
  while exists (select 1 from cup.players where room_id = r.id and nick_key = lower(v_nick)) loop
    n := n + 1; v_nick := left(base, 16 - length(n::text) - 1) || ' ' || n;
  end loop;
  insert into cup.players(room_id, nick, nick_key, device, secret_hash)
  values (r.id, v_nick, lower(v_nick), p_device, cup.hash(secret)) returning * into p;
  return jsonb_build_object('player_id', p.id, 'secret', secret, 'nick', p.nick, 'rejoined', false);
end $$;

create function cup.impl_ready(p_code text, p_player uuid, p_secret text, p_ready boolean)
returns jsonb language plpgsql set search_path = '' as $$
declare r cup.rooms; p cup.players;
begin
  r := cup.get_room(p_code); p := cup.auth_player(r, p_player, p_secret);
  if r.status = 'LOBBY' then update cup.players set ready = coalesce(p_ready, false) where id = p.id; end if;
  return jsonb_build_object('ok', true);
end $$;

create function cup.impl_leave(p_code text, p_player uuid, p_secret text)
returns jsonb language plpgsql set search_path = '' as $$
declare r cup.rooms; p cup.players;
begin
  r := cup.get_room(p_code); p := cup.auth_player(r, p_player, p_secret);
  if r.status = 'LOBBY' then delete from cup.players where id = p.id; end if;
  return jsonb_build_object('ok', true);
end $$;

create function cup.impl_kick(p_code text, p_host_secret text, p_player uuid)
returns jsonb language plpgsql set search_path = '' as $$
declare r cup.rooms;
begin
  r := cup.get_room(p_code, true); perform cup.auth_host(r, p_host_secret);
  if r.status = 'LOBBY' then delete from cup.players where id = p_player and room_id = r.id;
  else
    update cup.players set kicked = true where id = p_player and room_id = r.id;
    delete from cup.round_players rp using cup.rounds rd
     where rp.round_id = rd.id and rd.room_id = r.id and rd.status = 'active' and rp.player_id = p_player;
  end if;
  return jsonb_build_object('ok', true);
end $$;

create function cup.impl_cancel(p_code text, p_host_secret text)
returns jsonb language plpgsql set search_path = '' as $$
declare r cup.rooms;
begin
  r := cup.get_room(p_code, true); perform cup.auth_host(r, p_host_secret);
  delete from cup.rooms where id = r.id;
  return jsonb_build_object('ok', true);
end $$;

create function cup.impl_start(p_code text, p_host_secret text)
returns jsonb language plpgsql set search_path = '' as $$
declare r cup.rooms; ids uuid[]; grps int[];
begin
  r := cup.get_room(p_code, true); perform cup.auth_host(r, p_host_secret);
  if r.status <> 'LOBBY' then perform cup.err('BAD_STATE', 'Spelet har redan startat.'); end if;
  select array_agg(id order by seq), array_agg(0 order by seq) into ids, grps from cup.players where room_id = r.id and not kicked;
  if coalesce(array_length(ids, 1), 0) < 2 then perform cup.err('TOO_FEW', 'Minst två spelare krävs.'); end if;
  perform cup.mk_round(r, 'qual', 'main', 1, r.qual_q, ids, grps);
  return jsonb_build_object('ok', true);
end $$;

create function cup.impl_end_round(p_code text, p_host_secret text)
returns jsonb language plpgsql set search_path = '' as $$
declare r cup.rooms;
begin
  r := cup.get_room(p_code, true); perform cup.auth_host(r, p_host_secret);
  update cup.rounds set status = 'done', deadline = least(deadline, now())
   where room_id = r.id and status = 'active' and now() >= starts_at;
  update cup.rooms set status = 'SCORED' where id = r.id and status = 'ACTIVE'
     and not exists (select 1 from cup.rounds where room_id = r.id and status = 'active');
  return jsonb_build_object('ok', true);
end $$;

create function cup.impl_answer(p_code text, p_player uuid, p_secret text, p_round uuid, p_idx int, p_val int)
returns jsonb language plpgsql set search_path = '' as $$
declare r cup.rooms; p cup.players; rd cup.rounds; q cup.questions; have int; prev cup.answers; ok boolean;
begin
  r := cup.get_room(p_code); p := cup.auth_player(r, p_player, p_secret);
  perform cup.tick(r.id);
  select * into rd from cup.rounds where id = p_round and room_id = r.id;
  if not found then perform cup.err('NO_ROUND', 'Okänd runda.'); end if;
  if not exists (select 1 from cup.round_players where round_id = rd.id and player_id = p.id) then
    perform cup.err('NOT_IN_ROUND', 'Du deltar inte i den här rundan.'); end if;
  -- idempotent: redan besvarad fråga ger samma svar tillbaka (dubbelklick, omsändning)
  select * into prev from cup.answers where round_id = rd.id and player_id = p.id and idx = p_idx;
  if found then return jsonb_build_object('ok', true, 'duplicate', true); end if;
  if rd.status <> 'active' or now() > rd.deadline then perform cup.err('LATE', 'Tiden är slut för den här rundan.'); end if;
  if now() < rd.starts_at then perform cup.err('EARLY', 'Rundan har inte börjat än.'); end if;
  if p_val is null or p_val < 0 or p_val > 10000 then perform cup.err('BAD_VALUE', 'Skriv ett tal.'); end if;
  select count(*) into have from cup.answers where round_id = rd.id and player_id = p.id;
  if p_idx <> have then perform cup.err('OUT_OF_ORDER', 'Fel fråga.'); end if;
  select * into q from cup.questions where round_id = rd.id and idx = p_idx;
  if not found then perform cup.err('NO_QUESTION', 'Frågan finns inte.'); end if;
  ok := (q.ans = p_val);
  insert into cup.answers(round_id, player_id, idx, val, correct) values (rd.id, p.id, p_idx, p_val, ok)
    on conflict do nothing;
  perform cup.tick(r.id);
  -- Tävlingsintegritet: ingen korrekthet och inget facit före rundans slut (samma frågor delas av alla).
  -- Genomgång med rätt/fel och facit levereras av cup_state först när rundan är avslutad.
  return jsonb_build_object('ok', true, 'duplicate', false, 'answered', have + 1);
end $$;

-- ---------- turneringslogik ----------
-- tiers = lista av listor med spelar-id i rankordning; lika poäng = samma tier
create function cup.tiers_from_scores(p_round uuid) returns jsonb language sql stable as $$
  select coalesce(jsonb_agg(t.ids order by t.score desc), '[]'::jsonb) from (
    select s.correct as score, jsonb_agg(s.player_id order by pl.seq) as ids
    from cup.round_scores(p_round) s join cup.players pl on pl.id = s.player_id
    group by s.correct
  ) t
$$;

create function cup.uuids(j jsonb) returns uuid[] language sql immutable as
$$ select coalesce(array_agg(t.e::uuid order by t.o), '{}') from jsonb_array_elements_text(j) with ordinality as t(e, o) $$;

create function cup.start_final_game(r cup.rooms, p_game int) returns void language plpgsql as $$
declare fin uuid[];
begin
  fin := cup.uuids((select meta->'finalists' from cup.rooms where id = r.id));
  perform cup.mk_round(r, 'final', 'main', p_game, 5, fin, array[0, 0]);
end $$;

create function cup.after_final_win(r cup.rooms, p_winner uuid) returns void language plpgsql as $$
declare m jsonb; w int; champ uuid; fin uuid[]; other uuid; g int; podium jsonb;
begin
  select meta into m from cup.rooms where id = r.id;
  w := coalesce((m->'wins'->>(p_winner::text))::int, 0) + 1;
  m := jsonb_set(m, array['wins', p_winner::text], to_jsonb(w), true);
  update cup.rooms set meta = m where id = r.id;
  if w >= 2 then
    fin := cup.uuids(m->'finalists');
    other := case when fin[1] = p_winner then fin[2] else fin[1] end;
    podium := jsonb_build_array(p_winner, other) || coalesce(m->'third', '[]'::jsonb);
    update cup.rooms set status = 'COMPLETE', stage = 'done', meta = jsonb_set(meta, '{podium}', podium) where id = r.id;
  else
    select max(game) into g from cup.rounds where room_id = r.id and stage = 'final';
    perform cup.start_final_game(r, g + 1);
  end if;
end $$;

create function cup.impl_next(p_code text, p_host_secret text)
returns jsonb language plpgsql set search_path = '' as $$
declare r cup.rooms; lr cup.rounds; m jsonb; tiers jsonb; cut int; i int; pos int := 0; len int; tied_idx int := -1;
        sub jsonb; ids uuid[]; grps int[]; flat uuid[]; sc record; tb int; hi uuid; lo uuid; pending jsonb; semi jsonb; g int;
        res jsonb; newtiers jsonb; j int; ta uuid; tb_ uuid; ca int; cb int; winners uuid[]; losers uuid[];
begin
  r := cup.get_room(p_code, true); perform cup.auth_host(r, p_host_secret);
  perform cup.tick(r.id);
  select * into r from cup.rooms where id = r.id;
  if r.status <> 'SCORED' then perform cup.err('BAD_STATE', 'Rundan pågår fortfarande eller spelet är klart.'); end if;
  select * into lr from cup.rounds where room_id = r.id order by no desc limit 1;
  m := r.meta;

  -- ===== KVAL =====
  if lr.stage = 'qual' then
    if lr.kind = 'main' then
      tiers := cup.tiers_from_scores(lr.id);
      m := jsonb_set(m, '{tbcount}', '0'::jsonb, true);
      select count(*) into len from cup.round_players where round_id = lr.id;
      cut := case when len >= 4 then 4 else 2 end;
      m := jsonb_set(m, '{cut}', to_jsonb(cut), true);
      m := jsonb_set(m, '{standings}', cup.standings(lr.id), true);
    else
      -- utslagsrunda: dela upp den tier som var oavgjord
      cut := (m->>'cut')::int;
      tiers := m->'tiers';
      i := (m->>'pending_tier')::int;
      sub := cup.tiers_from_scores(lr.id);
      newtiers := '[]'::jsonb;
      for j in 0 .. jsonb_array_length(tiers) - 1 loop
        if j = i then
          newtiers := newtiers || sub;
        else
          newtiers := newtiers || jsonb_build_array(tiers->j);
        end if;
      end loop;
      tiers := newtiers;
      m := jsonb_set(m, '{tbcount}', to_jsonb((m->>'tbcount')::int + 1), true);
    end if;
    -- hitta tier som korsar gränsen (cut)
    pos := 0; tied_idx := -1;
    for i in 0 .. jsonb_array_length(tiers) - 1 loop
      len := jsonb_array_length(tiers->i);
      if pos < cut and pos + len > cut then tied_idx := i; exit; end if;
      pos := pos + len;
    end loop;
    if tied_idx >= 0 then
      if (m->>'tbcount')::int >= 5 then
        -- kan inte skiljas åt: avgör deterministiskt på anslutningsordning, markera tydligt
        newtiers := '[]'::jsonb;
        for j in 0 .. jsonb_array_length(tiers) - 1 loop
          if j = tied_idx then
            for sc in select e from jsonb_array_elements(tiers->j) e loop
              newtiers := newtiers || jsonb_build_array(jsonb_build_array(sc.e));
            end loop;
          else newtiers := newtiers || jsonb_build_array(tiers->j); end if;
        end loop;
        tiers := newtiers;
        m := jsonb_set(m, '{forced}', 'true'::jsonb, true);
      else
        m := jsonb_set(m, '{tiers}', tiers, true);
        m := jsonb_set(m, '{pending_tier}', to_jsonb(tied_idx), true);
        update cup.rooms set meta = m where id = r.id;
        ids := cup.uuids(tiers->tied_idx);
        grps := array_fill(0, array[array_length(ids, 1)]);
        perform cup.mk_round(r, 'qual', 'tb', 1, 3, ids, grps);
        return jsonb_build_object('ok', true, 'next', 'tiebreak');
      end if;
    end if;
    m := jsonb_set(m, '{tiers}', tiers, true);
    -- platta ut seedning
    select array_agg(b.e::uuid order by a.ti, b.ei) into flat
      from jsonb_array_elements(tiers) with ordinality as a(x, ti),
           lateral jsonb_array_elements_text(a.x) with ordinality as b(e, ei);
    m := jsonb_set(m, '{seeds}', to_jsonb(flat), true);
    if cut = 4 then
      semi := jsonb_build_array(
        jsonb_build_object('a', flat[1], 'b', flat[4], 'w', null),
        jsonb_build_object('a', flat[2], 'b', flat[3], 'w', null));
      m := jsonb_set(m, '{semi}', semi, true);
      m := jsonb_set(m, '{tbcount}', '0'::jsonb, true);
      update cup.rooms set meta = m where id = r.id;
      perform cup.mk_round(r, 'semi', 'main', 1, 5,
        array[flat[1], flat[4], flat[2], flat[3]], array[1, 1, 2, 2]);
      return jsonb_build_object('ok', true, 'next', 'semi');
    else
      m := jsonb_set(m, '{finalists}', jsonb_build_array(flat[1], flat[2]), true);
      m := jsonb_set(m, '{wins}', '{}'::jsonb, true);
      m := jsonb_set(m, '{third}', coalesce(to_jsonb(flat[3:3]), '[]'::jsonb), true);
      update cup.rooms set meta = m where id = r.id;
      perform cup.start_final_game(r, 1);
      return jsonb_build_object('ok', true, 'next', 'final');
    end if;
  end if;

  -- ===== SEMIFINAL =====
  if lr.stage = 'semi' then
    semi := m->'semi';
    -- avgör varje match där vinnare saknas, utifrån denna rundas poäng per grupp
    res := '[]'::jsonb;
    for i in 0 .. 1 loop
      if (semi->i->>'w') is null then
        select s.correct into ca from cup.round_scores(lr.id) s where s.player_id = (semi->i->>'a')::uuid;
        select s.correct into cb from cup.round_scores(lr.id) s where s.player_id = (semi->i->>'b')::uuid;
        ca := coalesce(ca, 0); cb := coalesce(cb, 0);
        if ca > cb then semi := jsonb_set(semi, array[i::text, 'w'], to_jsonb(semi->i->>'a'));
        elsif cb > ca then semi := jsonb_set(semi, array[i::text, 'w'], to_jsonb(semi->i->>'b'));
        elsif lr.kind = 'tb' and (m->>'tbcount')::int >= 4 then
          semi := jsonb_set(semi, array[i::text, 'w'], to_jsonb(semi->i->>'a'));
          m := jsonb_set(m, '{forced}', 'true'::jsonb, true);
        end if;
      end if;
    end loop;
    if lr.kind = 'tb' then m := jsonb_set(m, '{tbcount}', to_jsonb((m->>'tbcount')::int + 1), true); end if;
    m := jsonb_set(m, '{semi}', semi, true);
    ids := '{}'; grps := '{}';
    for i in 0 .. 1 loop
      if (semi->i->>'w') is null then
        ids := ids || (semi->i->>'a')::uuid || (semi->i->>'b')::uuid;
        grps := grps || (i + 1) || (i + 1);
      end if;
    end loop;
    if array_length(ids, 1) is not null then
      update cup.rooms set meta = m where id = r.id;
      perform cup.mk_round(r, 'semi', 'tb', 1, 3, ids, grps);
      return jsonb_build_object('ok', true, 'next', 'tiebreak');
    end if;
    -- finalister och semifinalförlorare sorteras efter kvalplacering (seed): index 1 är alltid den bättre seedade
    ids := cup.uuids(m->'seeds');
    winners := array[(semi->0->>'w')::uuid, (semi->1->>'w')::uuid];
    losers := array[
      case when (semi->0->>'w') = (semi->0->>'a') then (semi->0->>'b')::uuid else (semi->0->>'a')::uuid end,
      case when (semi->1->>'w') = (semi->1->>'a') then (semi->1->>'b')::uuid else (semi->1->>'a')::uuid end];
    if array_position(ids, winners[2]) < array_position(ids, winners[1]) then winners := array[winners[2], winners[1]]; end if;
    if array_position(ids, losers[2]) < array_position(ids, losers[1]) then losers := array[losers[2], losers[1]]; end if;
    m := jsonb_set(m, '{finalists}', to_jsonb(winners), true);
    m := jsonb_set(m, '{third}', to_jsonb(losers), true);
    m := jsonb_set(m, '{wins}', '{}'::jsonb, true);
    update cup.rooms set meta = m where id = r.id;
    perform cup.start_final_game(r, 1);
    return jsonb_build_object('ok', true, 'next', 'final');
  end if;

  -- ===== FINAL (bäst av tre) =====
  if lr.stage = 'final' then
    ids := cup.uuids(m->'finalists');
    select s.correct into ca from cup.round_scores(lr.id) s where s.player_id = ids[1];
    select s.correct into cb from cup.round_scores(lr.id) s where s.player_id = ids[2];
    ca := coalesce(ca, 0); cb := coalesce(cb, 0);
    if lr.kind = 'main' then m := jsonb_set(m, '{tbcount}', '0'::jsonb, true); else m := jsonb_set(m, '{tbcount}', to_jsonb((m->>'tbcount')::int + 1), true); end if;
    update cup.rooms set meta = m where id = r.id;
    if ca = cb and not (lr.kind = 'tb' and (m->>'tbcount')::int >= 5) then
      perform cup.mk_round(r, 'final', 'tb', lr.game, 3, ids, array[0, 0]);
      return jsonb_build_object('ok', true, 'next', 'tiebreak');
    end if;
    if ca = cb then
      update cup.rooms set meta = jsonb_set(meta, '{forced}', 'true'::jsonb, true) where id = r.id;
      perform cup.after_final_win(r, ids[1]);
    elsif ca > cb then perform cup.after_final_win(r, ids[1]);
    else perform cup.after_final_win(r, ids[2]); end if;
    return jsonb_build_object('ok', true, 'next', 'final');
  end if;
  perform cup.err('BAD_STATE', 'Inget nästa steg.');
  return null;
end $$;

-- rankning som json: [{id,nick,correct,rank}] för en runda
create function cup.standings(p_round uuid) returns jsonb language sql stable as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', x.player_id, 'nick', x.nick, 'correct', x.correct, 'answered', x.answered, 'rank', x.rk, 'grp', x.grp) order by x.rk, x.seq), '[]'::jsonb) from (
    select s.player_id, pl.nick, pl.seq, s.correct, s.answered, s.grp, rank() over (order by s.correct desc) as rk
    from cup.round_scores(p_round) s join cup.players pl on pl.id = s.player_id
  ) x
$$;

create function cup.impl_state(p_code text, p_player uuid default null, p_secret text default null, p_host_secret text default null)
returns jsonb language plpgsql set search_path = '' as $$
declare r cup.rooms; p cup.players; is_host boolean := false; rd cup.rounds; lr cup.rounds; out jsonb; have int; q cup.questions;
        players_j jsonb; round_j jsonb := null; res_j jsonb := null; m jsonb; parts int; fin int; names jsonb; review jsonb; me_in boolean := false;
begin
  r := cup.get_room(p_code);
  if p_host_secret is not null then perform cup.auth_host(r, p_host_secret); is_host := true; end if;
  if p_player is not null then p := cup.auth_player(r, p_player, p_secret); end if;
  if p.id is null and not is_host then perform cup.err('BAD_PLAYER', 'Spelaren känns inte igen.'); end if;
  -- begränsning: en spelare får fråga högst ~10 ggr/s; värdens polling begränsas per rum
  if p.id is not null then
    if p.last_poll is not null and clock_timestamp() - p.last_poll < interval '100 milliseconds' then perform cup.err('RATE', 'För många förfrågningar.'); end if;
    update cup.players set last_poll = clock_timestamp() where id = p.id;
  else
    perform cup.throttle('hoststate', r.id::text, 100, 10);
  end if;
  perform cup.tick(r.id);
  select * into r from cup.rooms where id = r.id;
  m := r.meta;
  select coalesce(jsonb_agg(jsonb_build_object('id', pl.id, 'nick', pl.nick, 'ready', pl.ready, 'online', pl.last_seen > now() - interval '20 seconds', 'me', pl.id = p.id) order by pl.seq), '[]'::jsonb)
    into players_j from cup.players pl where pl.room_id = r.id and not pl.kicked;
  select * into lr from cup.rounds where room_id = r.id order by no desc limit 1;
  if found then
    select count(*), count(*) filter (where (select count(*) from cup.answers a where a.round_id = lr.id and a.player_id = rp.player_id) >= lr.n_q)
      into parts, fin from cup.round_players rp where rp.round_id = lr.id;
    if p.id is not null then me_in := exists (select 1 from cup.round_players where round_id = lr.id and player_id = p.id); end if;
    round_j := jsonb_build_object('id', lr.id, 'no', lr.no, 'stage', lr.stage, 'kind', lr.kind, 'game', lr.game, 'n_q', lr.n_q,
      'status', lr.status, 'participants', parts, 'finished', fin, 'you_in', me_in,
      'starts_in_ms', greatest(0, floor(extract(epoch from (lr.starts_at - now())) * 1000))::int,
      'ms_left', case when lr.status = 'active' then greatest(0, floor(extract(epoch from (lr.deadline - now())) * 1000))::int else 0 end);
    if lr.status = 'active' and me_in then
      select count(*) into have from cup.answers where round_id = lr.id and player_id = p.id;
      round_j := round_j || jsonb_build_object('answered', have);
      if have < lr.n_q and now() >= lr.starts_at then
        select * into q from cup.questions where round_id = lr.id and idx = have;
        round_j := round_j || jsonb_build_object('question', jsonb_build_object('idx', q.idx, 'a', q.a, 'b', q.b));
      end if;
    end if;
    if lr.status = 'done' then
      res_j := jsonb_build_object('round', cup.standings(lr.id));
      if p.id is not null and me_in then
        select coalesce(jsonb_agg(jsonb_build_object('a', qq.a, 'b', qq.b, 'ans', qq.ans, 'val', an.val, 'ok', an.correct) order by qq.idx), '[]'::jsonb)
          into review from cup.questions qq left join cup.answers an on an.round_id = qq.round_id and an.player_id = p.id and an.idx = qq.idx
         where qq.round_id = lr.id;
        res_j := res_j || jsonb_build_object('review', review);
      end if;
    end if;
  end if;
  -- spelare-id → nick för bracket
  select coalesce(jsonb_object_agg(pl.id::text, pl.nick), '{}'::jsonb) into names from cup.players pl where pl.room_id = r.id;
  out := jsonb_build_object(
    'now', now(), 'code', r.code, 'status', r.status, 'stage', r.stage, 'tables', to_jsonb(r.tables),
    'qual_q', r.qual_q, 'sec_per_q', r.sec_per_q, 'is_host', is_host, 'me', case when p.id is null then null else p.id end,
    'players', players_j, 'round', round_j, 'results', res_j, 'names', names,
    'bracket', jsonb_build_object('standings', m->'standings', 'semi', m->'semi', 'finalists', m->'finalists',
       'wins', m->'wins', 'podium', m->'podium', 'forced', coalesce(m->'forced', 'false'::jsonb),
       'seeds', m->'seeds', 'cut', m->'cut'));
  return out;
end $$;


-- ---------- skyddslager: räknare som överlever fel ----------
-- Postgres rullar tillbaka allt när en funktion kastar fel, även räknare. Därför kastar de publika RPC-funktionerna aldrig:
-- felet fångas i ett undertransaktionsblock och returneras som {"error": "KOD: text"}; räknare utanför blocket sparas.
create function cup.guard() returns void language plpgsql as $$
declare k text := cup.client_key(); f int;
begin
  if random() < 0.02 then  -- gallring: utgångna räknare (IP-hashar) och rum (smeknamn, enhets-id) raderas även om ingen skapar rum
    delete from cup.rate where until_at < now();
    delete from cup.rooms where expires_at < now();
  end if;
  if k is not null then
    select n into f from cup.rate where bucket = 'fail:' || k and win = floor(extract(epoch from now()) / 60);
    if coalesce(f, 0) >= 120 then perform cup.err('RATE', 'För många felaktiga förfrågningar. Vänta en minut.'); end if;
    perform cup.throttle('rpc', k, 3000, 60);
  end if;
end $$;

create function cup.note_fail() returns void language plpgsql as $$
declare k text := cup.client_key();
begin
  if k is not null then begin perform cup.throttle('fail', k, 1000000, 60); exception when others then null; end; end if;
end $$;

-- ---------- publika RPC (tunna skal runt cup.impl_*) ----------
create function public.cup_create(p_tables int[] default null, p_qual_q int default 10, p_sec_per_q int default 20)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  begin perform cup.guard(); exception when sqlstate 'P0001' then return jsonb_build_object('error', sqlerrm); end;
  begin
    return cup.impl_create(p_tables, p_qual_q, p_sec_per_q);
  exception when sqlstate 'P0001' then
    perform cup.note_fail();
    return jsonb_build_object('error', sqlerrm);
  end;
end $$;
create function public.cup_join(p_code text, p_nick text, p_device text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  begin perform cup.guard(); exception when sqlstate 'P0001' then return jsonb_build_object('error', sqlerrm); end;
  begin
    return cup.impl_join(p_code, p_nick, p_device);
  exception when sqlstate 'P0001' then
    perform cup.note_fail();
    return jsonb_build_object('error', sqlerrm);
  end;
end $$;
create function public.cup_ready(p_code text, p_player uuid, p_secret text, p_ready boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  begin perform cup.guard(); exception when sqlstate 'P0001' then return jsonb_build_object('error', sqlerrm); end;
  begin
    return cup.impl_ready(p_code, p_player, p_secret, p_ready);
  exception when sqlstate 'P0001' then
    perform cup.note_fail();
    return jsonb_build_object('error', sqlerrm);
  end;
end $$;
create function public.cup_leave(p_code text, p_player uuid, p_secret text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  begin perform cup.guard(); exception when sqlstate 'P0001' then return jsonb_build_object('error', sqlerrm); end;
  begin
    return cup.impl_leave(p_code, p_player, p_secret);
  exception when sqlstate 'P0001' then
    perform cup.note_fail();
    return jsonb_build_object('error', sqlerrm);
  end;
end $$;
create function public.cup_kick(p_code text, p_host_secret text, p_player uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  begin perform cup.guard(); exception when sqlstate 'P0001' then return jsonb_build_object('error', sqlerrm); end;
  begin
    return cup.impl_kick(p_code, p_host_secret, p_player);
  exception when sqlstate 'P0001' then
    perform cup.note_fail();
    return jsonb_build_object('error', sqlerrm);
  end;
end $$;
create function public.cup_cancel(p_code text, p_host_secret text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  begin perform cup.guard(); exception when sqlstate 'P0001' then return jsonb_build_object('error', sqlerrm); end;
  begin
    return cup.impl_cancel(p_code, p_host_secret);
  exception when sqlstate 'P0001' then
    perform cup.note_fail();
    return jsonb_build_object('error', sqlerrm);
  end;
end $$;
create function public.cup_start(p_code text, p_host_secret text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  begin perform cup.guard(); exception when sqlstate 'P0001' then return jsonb_build_object('error', sqlerrm); end;
  begin
    return cup.impl_start(p_code, p_host_secret);
  exception when sqlstate 'P0001' then
    perform cup.note_fail();
    return jsonb_build_object('error', sqlerrm);
  end;
end $$;
create function public.cup_end_round(p_code text, p_host_secret text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  begin perform cup.guard(); exception when sqlstate 'P0001' then return jsonb_build_object('error', sqlerrm); end;
  begin
    return cup.impl_end_round(p_code, p_host_secret);
  exception when sqlstate 'P0001' then
    perform cup.note_fail();
    return jsonb_build_object('error', sqlerrm);
  end;
end $$;
create function public.cup_answer(p_code text, p_player uuid, p_secret text, p_round uuid, p_idx int, p_val int)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  begin perform cup.guard(); exception when sqlstate 'P0001' then return jsonb_build_object('error', sqlerrm); end;
  begin
    return cup.impl_answer(p_code, p_player, p_secret, p_round, p_idx, p_val);
  exception when sqlstate 'P0001' then
    perform cup.note_fail();
    return jsonb_build_object('error', sqlerrm);
  end;
end $$;
create function public.cup_next(p_code text, p_host_secret text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  begin perform cup.guard(); exception when sqlstate 'P0001' then return jsonb_build_object('error', sqlerrm); end;
  begin
    return cup.impl_next(p_code, p_host_secret);
  exception when sqlstate 'P0001' then
    perform cup.note_fail();
    return jsonb_build_object('error', sqlerrm);
  end;
end $$;
create function public.cup_state(p_code text, p_player uuid default null, p_secret text default null, p_host_secret text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  begin perform cup.guard(); exception when sqlstate 'P0001' then return jsonb_build_object('error', sqlerrm); end;
  begin
    return cup.impl_state(p_code, p_player, p_secret, p_host_secret);
  exception when sqlstate 'P0001' then
    perform cup.note_fail();
    return jsonb_build_object('error', sqlerrm);
  end;
end $$;

-- ---------- rättigheter ----------
-- Endast Cups egna objekt. Ingen global REVOKE i schema public (skulle ändra andra appars funktioner).
-- Klienten får köra exakt de publika cup_*-funktionerna; allt i schema cup (tabeller, hjälpfunktioner) är stängt.
do $$ declare f record; begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in ('cup_create','cup_join','cup_ready','cup_leave','cup_kick','cup_cancel','cup_start','cup_end_round','cup_answer','cup_next','cup_state') loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
    execute format('grant execute on function %s to anon, authenticated', f.sig);
  end loop;
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'cup' loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;
revoke all on all tables in schema cup from public, anon, authenticated;
revoke all on all sequences in schema cup from public, anon, authenticated;
