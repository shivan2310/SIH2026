REVOKE ALL ON FUNCTION public.is_cohort_instructor(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_cohort_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.teaches_user(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_cohort_instructor(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_cohort_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.teaches_user(uuid, uuid) TO authenticated, service_role;