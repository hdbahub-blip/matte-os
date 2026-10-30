-- Matte OS Cup v5.5.0 · scheduled privacy retention · dedicated Supabase project only.
-- Must run AFTER 0001_matte_os_cup.sql. This schema alone stores no long-term educational records.
-- Cron clears short-lived IP-hash/rate buckets and expired rooms even without website traffic.
-- A 5-minute schedule means the actual deletion deadline is up to ~5 minutes after expiry.
-- Do not remove the shared pg_cron extension during rollback; only unschedule this Cup job.
create extension if not exists pg_cron;
select cron.schedule(
  'matte-os-cup-purge',
  '*/5 * * * *',
  $$delete from cup.rate where until_at < now();
    delete from cup.rooms where expires_at < now();$$
);
