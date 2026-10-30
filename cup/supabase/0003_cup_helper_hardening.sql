-- Matte OS Cup v5.5.0 · defense in depth for private helper functions.
-- Scope: only routines in schema cup. The eleven public RPC already have search_path=''.
-- All Cup helper references are schema-qualified or PG-catalog built-ins.
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as signature
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'cup' and p.prokind = 'f'
  loop
    execute format('alter function %s set search_path = %L', f.signature, '');
  end loop;
end $$;
-- Safe covering index for the separate player FK, improves deletes and joins.
create index if not exists round_players_player_idx on cup.round_players(player_id);
