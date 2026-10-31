-- Matte OS Cup 5.5.2 - isolated quickmatch option, preserving legacy Cup.
-- Apply ONLY to a disposable staging/test database before owner-authorized production migration.
-- Existing rooms default to mode='cup', so active tournaments remain backward-compatible.
-- No changes to any student progress or other projects.

alter table cup.rooms add column mode text not null default 'cup'
  check (mode in ('cup', 'quick'));
alter table cup.rooms add column quick_q integer not null default 10
  check (quick_q in (5,10,20));
alter table cup.rooms add column quick_rounds integer not null default 1
  check (quick_rounds in (1,3,5));

-- Reuse established room creation, anti-abuse rate limits and host-token generation.
-- The new RPC accepts only explicit valid quickmatch presets.
create function cup.impl_create_quick(
  p_tables int[], p_questions int, p_rounds int, p_sec_per_q int
) returns jsonb language plpgsql set search_path = '' as $$
declare info jsonb;
begin
  if p_questions is null or p_questions not in (5,10,20)
     or p_rounds is null or p_rounds not in (1,3,5)
     or p_sec_per_q is null or p_sec_per_q not in (15,20,30) then
    perform cup.err('BAD_SETTINGS', 'Välj 5, 10 eller 20 frågor och 1, 3 eller 5 omgångar.');
  end if;
  if p_tables is null or coalesce(array_length(p_tables,1),0) < 1
     or exists(select 1 from unnest(p_tables) t where t < 1 or t > 10) then
    perform cup.err('BAD_SETTINGS', 'Välj minst en tabell mellan 1 och 10.');
  end if;
  info := cup.impl_create(p_tables,p_questions,p_sec_per_q);
  update cup.rooms set mode='quick', quick_q=p_questions, quick_rounds=p_rounds
    where code=info->>'code' and host_hash=cup.hash(info->>'host_secret') and status='LOBBY';
  if not found then perform cup.err('CREATE_FAILED', 'Kunde inte skapa snabbmatchen.'); end if;
  return info;
end $$;

create function public.cup_create_quick(
  p_tables int[], p_questions int, p_rounds int, p_sec_per_q int
) returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  begin perform cup.guard(); exception when sqlstate 'P0001'
    then return jsonb_build_object('error',sqlerrm); end;
  begin
    return cup.impl_create_quick(p_tables,p_questions,p_rounds,p_sec_per_q);
  exception when sqlstate 'P0001' then
    perform cup.note_fail();
    return jsonb_build_object('error',sqlerrm);
  end;
end $$;

-- Host-only, row-locked transition. No duplicate advancement.
-- The points are accumulated server-side from actual answers (never from client scores).
create function cup.impl_quick_next(p_code text,p_host_secret text)
returns jsonb language plpgsql set search_path = '' as $$
declare r cup.rooms; lr cup.rounds; ids uuid[]; grps int[];
        scores jsonb; podium jsonb; tied boolean;
begin
  r := cup.get_room(p_code,true);
  perform cup.auth_host(r,p_host_secret);
  if r.mode <> 'quick' then perform cup.err('BAD_MODE','Det här är inte en snabbmatch.'); end if;
  perform cup.tick(r.id);
  select * into r from cup.rooms where id=r.id;
  if r.status <> 'SCORED' then perform cup.err('BAD_STATE','Vänta tills omgången är klar.'); end if;
  select * into lr from cup.rounds where room_id=r.id order by no desc limit 1;
  if lr.id is null or lr.stage <> 'qual' or lr.kind <> 'main' then
    perform cup.err('BAD_STATE','Fel omgång.');
  end if;
  -- Count only scored completed quickmatch rounds; rank ties together.
  with totals as (
    select pl.id,pl.nick,pl.seq,coalesce(sum(sc.correct),0)::int as correct
    from cup.players pl
    left join cup.round_players rp on rp.player_id=pl.id
    left join cup.rounds rd on rd.id=rp.round_id and rd.room_id=r.id
      and rd.stage='qual' and rd.status='done'
    left join lateral cup.round_scores(rd.id) sc on sc.player_id=pl.id
    where pl.room_id=r.id and not pl.kicked
    group by pl.id,pl.nick,pl.seq
  ), ranked as (
    select *,rank() over(order by correct desc) as rank from totals
  )
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'nick',nick,'correct',correct,
           'rank',rank) order by rank,seq),'[]'::jsonb),
         coalesce(jsonb_agg(to_jsonb(id) order by rank,seq),'[]'::jsonb)
    into scores,podium from ranked;
  tied := jsonb_array_length(scores)>1 and
      (scores->0->>'correct')::int=(scores->1->>'correct')::int;
  update cup.rooms set meta=jsonb_set(
      jsonb_set(meta,'{quick_scores}',scores,true),'{quick_draw}',to_jsonb(tied),true)
    where id=r.id;
  if lr.no >= r.quick_rounds then
    update cup.rooms set status='COMPLETE',stage='done',
      meta=jsonb_set(meta,'{podium}',podium,true) where id=r.id;
    return jsonb_build_object('ok',true,'next','done');
  end if;
  select array_agg(id order by seq),array_agg(0 order by seq) into ids,grps
     from cup.players where room_id=r.id and not kicked;
  perform cup.mk_round(r,'qual','main',lr.no+1,r.quick_q,ids,grps);
  return jsonb_build_object('ok',true,'next','quick');
end $$;


-- Existing entrypoints extended only for quickmatch mode.
create or replace function cup.impl_start(p_code text, p_host_secret text)
returns jsonb language plpgsql set search_path = '' as $$
declare r cup.rooms; ids uuid[]; grps int[];
begin
  r := cup.get_room(p_code, true); perform cup.auth_host(r, p_host_secret);
  if r.status <> 'LOBBY' then perform cup.err('BAD_STATE', 'Spelet har redan startat.'); end if;
  select array_agg(id order by seq), array_agg(0 order by seq) into ids, grps from cup.players where room_id = r.id and not kicked;
  if coalesce(array_length(ids, 1), 0) < 2 then perform cup.err('TOO_FEW', 'Minst två spelare krävs.'); end if;
  perform cup.mk_round(r, 'qual', 'main', 1, case when r.mode = 'quick' then r.quick_q else r.qual_q end, ids, grps);
  return jsonb_build_object('ok', true);
end $$;

create or replace function cup.impl_next(p_code text, p_host_secret text)
returns jsonb language plpgsql set search_path = '' as $$
declare r cup.rooms; lr cup.rounds; m jsonb; tiers jsonb; cut int; i int; pos int := 0; len int; tied_idx int := -1;
        sub jsonb; ids uuid[]; grps int[]; flat uuid[]; sc record; tb int; hi uuid; lo uuid; pending jsonb; semi jsonb; g int;
        res jsonb; newtiers jsonb; j int; ta uuid; tb_ uuid; ca int; cb int; winners uuid[]; losers uuid[];
begin
  r := cup.get_room(p_code, true); perform cup.auth_host(r, p_host_secret);
  if r.mode = 'quick' then return cup.impl_quick_next(p_code, p_host_secret); end if;
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

create or replace function cup.impl_state(p_code text, p_player uuid default null, p_secret text default null, p_host_secret text default null)
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
    'qual_q', r.qual_q, 'sec_per_q', r.sec_per_q, 'mode', r.mode, 'quick_q', r.quick_q, 'quick_rounds', r.quick_rounds, 'is_host', is_host, 'me', case when p.id is null then null else p.id end,
    'players', players_j, 'round', round_j, 'results', res_j, 'names', names,
    'bracket', jsonb_build_object('standings', m->'standings', 'semi', m->'semi', 'finalists', m->'finalists',
       'wins', m->'wins', 'podium', m->'podium', 'forced', coalesce(m->'forced', 'false'::jsonb),
       'seeds', m->'seeds', 'cut', m->'cut', 'quick_scores', m->'quick_scores', 'quick_draw', m->'quick_draw'));
  return out;
end $$;

-- Grant only the new public entrypoint. All private helpers remain closed.
revoke all on function public.cup_create_quick(int[],int,int,int)
 from public,anon,authenticated;
grant execute on function public.cup_create_quick(int[],int,int,int)
 to anon,authenticated;
revoke all on function cup.impl_create_quick(int[],int,int,int)
 from public,anon,authenticated;
revoke all on function cup.impl_quick_next(text,text)
 from public,anon,authenticated;
