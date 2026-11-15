-- Live retention schedule executed with Supabase apply_migration 2026-11-15.
-- Depends on together_live.prune_expired(); private tables only.
-- Hourly job is idempotent by unique named schedule.
select cron.schedule('matte-os-together-live-expiry-v1',
                     '0 * * * *',
                     $$select together_live.prune_expired();$$);
