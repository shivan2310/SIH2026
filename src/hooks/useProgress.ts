import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LESSON_ORDER } from "@/lib/learn/content";
import { CHALLENGES } from "@/lib/learn/challenges";

export interface LessonProgressRow {
  lesson_id: string;
  completed: boolean;
  quiz_score: number;
  quiz_total: number;
  updated_at: string;
}

export interface AttemptRow {
  challenge_id: string;
  passed: boolean;
  created_at: string;
}

/** Loads the signed-in learner's lesson progress and challenge attempts. */
export function useProgress(userId: string | undefined) {
  const [lessons, setLessons] = useState<LessonProgressRow[]>([]);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) {
      setLessons([]);
      setAttempts([]);
      setLoading(false);
      return;
    }
    const [{ data: l }, { data: a }] = await Promise.all([
      supabase
        .from("lesson_progress")
        .select("lesson_id, completed, quiz_score, quiz_total, updated_at")
        .eq("user_id", userId),
      supabase
        .from("challenge_attempts")
        .select("challenge_id, passed, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);
    setLessons(l ?? []);
    setAttempts(a ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const completedLessons = lessons.filter((l) => l.completed).length;
  const solvedChallenges = new Set(
    attempts.filter((a) => a.passed).map((a) => a.challenge_id),
  );

  return {
    lessons,
    attempts,
    loading,
    reload,
    completedLessons,
    totalLessons: LESSON_ORDER.length,
    solvedChallenges,
    totalChallenges: CHALLENGES.length,
    /** Distinct days with activity, most recent first — used for streaks. */
    streak: computeStreak([
      ...lessons.map((l) => l.updated_at),
      ...attempts.map((a) => a.created_at),
    ]),
  };
}

function computeStreak(timestamps: string[]): number {
  const days = new Set(
    timestamps.map((t) => new Date(t).toISOString().slice(0, 10)),
  );
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (days.has(key)) {
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
      continue;
    }
    if (streak === 0) {
      // allow "yesterday" to still count as an active streak
      cursor.setUTCDate(cursor.getUTCDate() - 1);
      const y = cursor.toISOString().slice(0, 10);
      if (days.has(y)) continue;
    }
    break;
  }
  return streak;
}

/** Upsert a lesson's completion state and quiz score. */
export async function saveLessonProgress(input: {
  userId: string;
  lessonId: string;
  completed: boolean;
  quizScore: number;
  quizTotal: number;
}) {
  const { error } = await supabase.from("lesson_progress").upsert(
    {
      user_id: input.userId,
      lesson_id: input.lessonId,
      completed: input.completed,
      quiz_score: input.quizScore,
      quiz_total: input.quizTotal,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" },
  );
  if (error) throw error;
}

/** Record a graded challenge submission. */
export async function saveAttempt(input: {
  userId: string;
  challengeId: string;
  passed: boolean;
  code: string;
  feedback: string;
}) {
  const { error } = await supabase.from("challenge_attempts").insert({
    user_id: input.userId,
    challenge_id: input.challengeId,
    passed: input.passed,
    code: input.code,
    feedback: input.feedback,
  });
  if (error) throw error;
}
