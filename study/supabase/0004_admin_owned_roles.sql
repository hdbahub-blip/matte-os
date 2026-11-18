-- Matte OS · admin-owned account roles · apply ONLY after review and before public UI release.
-- Existing study_profiles rows are preserved. No auth user is changed.
BEGIN;
REVOKE INSERT ON TABLE public.study_profiles FROM authenticated;
DROP POLICY IF EXISTS study_profiles_create ON public.study_profiles;
-- No public or authenticated route can self-declare mentor privileges.
-- Privileged, audited administrators provision study_profiles after Auth user creation.
COMMENT ON TABLE public.study_profiles IS
 'Study Cloud roles and grades are assigned only by trusted administrators; authenticated users may not insert or update roles.';
COMMIT;
