import { useCallback, useEffect, useState } from "react";
import { getStudentProgress, saveLessonProgressAction, saveAttemptAction } from "@/lib/learn/actions";
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
    try {
      const data = await getStudentProgress();
      setLessons(data.lessons ?? []);
      setAttempts(data.attempts ?? []);
    } catch (err) {
      console.error("Failed to load progress", err);
      setLessons([]);
      setAttempts([]);
    }
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
  await saveLessonProgressAction({
    data: {
      lessonId: input.lessonId,
      completed: input.completed,
      quizScore: input.quizScore,
      quizTotal: input.quizTotal,
    },
  });
}

/** Record a graded challenge submission. */
export async function saveAttempt(input: {
  userId: string;
  challengeId: string;
  passed: boolean;
  code: string;
  feedback: string;
}) {
  await saveAttemptAction({
    data: {
      challengeId: input.challengeId,
      passed: input.passed,
      code: input.code,
      feedback: input.feedback,
    },
  });
}
