# Matte OS Cup — migration 0002, scheduled retention

**Status:** applies to the *separate* hdbahub Supabase project only. The app does not receive new access to personal information. No student login or student result database is introduced.

The original SQL (migration 0001) has an opportunistic 2% purge on API calls. It can leave expired records indefinitely when there is no traffic. **Migration 0002 adds an independent job every five minutes** using Supabase Cron / `pg_cron`. It deletes only expired `cup.rate` entries (salted IP-hash buckets) and expired `cup.rooms` entries (which cascade-delete players, questions, answers and rounds).

| Record | Logical expiration | Physical deletion with healthy scheduler |
|---|---|---|
| Rate buckets incl. pseudonymous hashed-IP identifiers | At most 20 minutes depending on rate window | At most approximately 25 minutes after bucket creation, plus scheduler delays |
| Room, player nickname, device id, round/scores | Six hours after creation | Normally no later than 6 hours + five minutes, plus scheduler delays |

**Operational verification:** check `cron.job` contains enabled `matte-os-cup-purge` on `*/5 * * * *`; check recent `cron.job_run_details` for `succeeded`, create short-lived synthetic rows and verify deletion after the next scheduled run. Alert/review if the job stops; estimates do not constitute an unconditional legal retention guarantee.

**Rollback:** first run `rollback_0002.sql`, which removes only the Cup Cron job, then run `rollback_0001.sql` to delete the Cup API functions and schema. The `pg_cron` extension is intentionally left in place because it is shared infrastructure. Do not run rollback without understanding that all Cup games will be deleted.

**Security:** no public read/write grants are added; the scheduled SQL executes under the job owner's database role. All previous Cup security gates remain mandatory. Real-world Supabase API, mobile, reconnection and authorized release approval are separate gates.
