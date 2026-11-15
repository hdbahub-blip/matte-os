-- Applied to existing Matte OS Supabase project on 2026-11-15.
-- Dedicated foreign-key covering indexes after post-migration advisor review.
create index if not exists together_live_members_user_idx on together_live.members(user_id);
create index if not exists together_live_answers_member_idx on together_live.answers(room_id,user_id);
