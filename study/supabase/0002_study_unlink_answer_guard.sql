-- Study Cloud hardening 0002 · Enforce current consent on every shared-answer insertion.
-- Existing sessions remain stored for the learner, but cannot be written to once sharing is revoked.
drop policy if exists study_session_answers_insert on public.study_session_answers;
create policy study_session_answers_insert on public.study_session_answers for insert to authenticated
with check (
 actor_id=(select auth.uid())
 and exists(
   select 1 from public.study_sessions s
   join public.study_links l
     on l.mentor_id=s.mentor_id and l.learner_id=s.learner_id and l.grade=s.grade
   where s.id=study_session_answers.session_id
     and s.phase='answering'
     and (s.mentor_id=(select auth.uid()) or s.learner_id=(select auth.uid()))
     and exists(
       select 1 from jsonb_array_elements(s.questions) q
       where q->>'id'=study_session_answers.question_id
     )
 )
);
