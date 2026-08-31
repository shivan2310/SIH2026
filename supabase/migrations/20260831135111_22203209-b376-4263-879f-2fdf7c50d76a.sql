CREATE TABLE public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  quiz_score integer NOT NULL DEFAULT 0,
  quiz_total integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.challenge_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id text NOT NULL,
  passed boolean NOT NULL DEFAULT false,
  code text NOT NULL DEFAULT '',
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.challenge_attempts TO authenticated;
GRANT ALL ON public.challenge_attempts TO service_role;
ALTER TABLE public.challenge_attempts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  join_code text NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cohorts TO authenticated;
GRANT ALL ON public.cohorts TO service_role;
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.cohort_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cohort_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.cohort_members TO authenticated;
GRANT ALL ON public.cohort_members TO service_role;
ALTER TABLE public.cohort_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('lesson', 'challenge')),
  item_id text NOT NULL,
  title text NOT NULL,
  due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.circuit_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circuit_id uuid NOT NULL REFERENCES public.circuits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.circuit_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.circuit_comments TO authenticated;
GRANT ALL ON public.circuit_comments TO service_role;
ALTER TABLE public.circuit_comments ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_cohort_instructor(_cohort_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.cohorts c WHERE c.id = _cohort_id AND c.instructor_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.teaches_user(_instructor_id uuid, _student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.cohort_members m
    JOIN public.cohorts c ON c.id = m.cohort_id
    WHERE c.instructor_id = _instructor_id AND m.user_id = _student_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_cohort_member(_cohort_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.cohort_members m WHERE m.cohort_id = _cohort_id AND m.user_id = _user_id)
$$;

CREATE POLICY "Learners manage their own progress" ON public.lesson_progress
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Instructors read their students progress" ON public.lesson_progress
  FOR SELECT TO authenticated USING (public.teaches_user(auth.uid(), user_id));

CREATE POLICY "Learners manage their own attempts" ON public.challenge_attempts
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Instructors read their students attempts" ON public.challenge_attempts
  FOR SELECT TO authenticated USING (public.teaches_user(auth.uid(), user_id));

CREATE POLICY "Instructors manage their cohorts" ON public.cohorts
  FOR ALL TO authenticated USING (auth.uid() = instructor_id) WITH CHECK (auth.uid() = instructor_id);
CREATE POLICY "Members can view their cohort" ON public.cohorts
  FOR SELECT TO authenticated USING (public.is_cohort_member(id, auth.uid()));

CREATE POLICY "Users manage their own membership" ON public.cohort_members
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Instructors view their cohort roster" ON public.cohort_members
  FOR SELECT TO authenticated USING (public.is_cohort_instructor(cohort_id, auth.uid()));
CREATE POLICY "Instructors remove roster entries" ON public.cohort_members
  FOR DELETE TO authenticated USING (public.is_cohort_instructor(cohort_id, auth.uid()));

CREATE POLICY "Instructors manage assignments" ON public.assignments
  FOR ALL TO authenticated USING (public.is_cohort_instructor(cohort_id, auth.uid()))
  WITH CHECK (public.is_cohort_instructor(cohort_id, auth.uid()));
CREATE POLICY "Members view assignments" ON public.assignments
  FOR SELECT TO authenticated USING (public.is_cohort_member(cohort_id, auth.uid()));

CREATE POLICY "Comments visible with the circuit" ON public.circuit_comments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.circuits c WHERE c.id = circuit_id AND (c.is_public OR c.user_id = auth.uid()))
  );
CREATE POLICY "Authors write comments" ON public.circuit_comments
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.circuits c WHERE c.id = circuit_id AND (c.is_public OR c.user_id = auth.uid())
    )
  );
CREATE POLICY "Authors edit their comments" ON public.circuit_comments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authors delete their comments" ON public.circuit_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER lesson_progress_set_updated_at BEFORE UPDATE ON public.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER cohorts_set_updated_at BEFORE UPDATE ON public.cohorts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();