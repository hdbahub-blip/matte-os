-- Matte OS Cup · rollback av 0001_matte_os_cup.sql. Tar bort ENDAST Cups egna objekt:
--   * de 11 publika RPC-funktionerna (uttryckligen namngivna, inget mönster som kan träffa andra appars funktioner)
--   * schema cup med alla tabeller, hjälp- och impl-funktioner (CASCADE gäller bara objekt i schema cup)
-- Rör inte: övriga funktioner/tabeller i public, extensions, roller (anon/authenticated), andra scheman.
-- Idempotent: kan köras flera gånger. FÖRLORAR alla pågående spel (rum, spelare, svar). Spara inget som behövs först.
do $$
declare f text;
begin
  foreach f in array array['cup_create','cup_join','cup_ready','cup_leave','cup_kick','cup_cancel','cup_start','cup_end_round','cup_answer','cup_next','cup_state'] loop
    execute (select coalesce(string_agg(format('drop function if exists %s', p.oid::regprocedure), '; '), 'select 1')
             from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = f);
  end loop;
end $$;
drop schema if exists cup cascade;
