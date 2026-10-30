-- Undo only the Matte OS Cup scheduled data-retention job.
-- Use BEFORE rollback_0001.sql, which deletes schema cup and all ongoing games.
-- Leave pg_cron extension untouched: it can be shared with unrelated workloads.
do $$
declare j bigint;
begin
  for j in select jobid from cron.job where jobname = 'matte-os-cup-purge'
  loop
    perform cron.unschedule(j);
  end loop;
end $$;
