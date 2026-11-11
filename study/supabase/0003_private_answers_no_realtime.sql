-- Keep sensitive pupil answers and full progress backups off PostgreSQL logical broadcasts.
-- Parent dashboard polls on an interval with fresh RLS every request.
-- This avoids any stale authorized Realtime subscriptions receiving post-revocation changes.
-- Shared session prompts may use Realtime; submitted participant answers cannot.
alter publication supabase_realtime drop table public.study_events;
alter publication supabase_realtime drop table public.study_snapshots;
alter publication supabase_realtime drop table public.study_session_answers;
