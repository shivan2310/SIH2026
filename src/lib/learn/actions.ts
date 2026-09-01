import { createServerFn } from "@tanstack/react-start";
import { db } from "../db/client";
import { requireAuth } from "../auth/server";

export const getStudentProgress = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const lessons = db
      .prepare(
        "SELECT lesson_id, completed, quiz_score, quiz_total, updated_at FROM lesson_progress WHERE user_id = ?"
      )
      .all(context.userId) as any[];

    const attempts = db
      .prepare(
        "SELECT challenge_id, passed, created_at FROM challenge_attempts WHERE user_id = ? ORDER BY created_at DESC"
      )
      .all(context.userId) as any[];

    return {
      lessons: lessons.map((l) => ({ ...l, completed: Boolean(l.completed) })),
      attempts: attempts.map((a) => ({ ...a, passed: Boolean(a.passed) })),
    };
  });

export const saveLessonProgressAction = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(
    (input: {
      lessonId: string;
      completed: boolean;
      quizScore: number;
      quizTotal: number;
    }) => input
  )
  .handler(async ({ data, context }) => {
    db.prepare(`
      INSERT INTO lesson_progress (user_id, lesson_id, completed, quiz_score, quiz_total, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, lesson_id) DO UPDATE SET
        completed = excluded.completed,
        quiz_score = excluded.quiz_score,
        quiz_total = excluded.quiz_total,
        updated_at = excluded.updated_at
    `).run(context.userId, data.lessonId, data.completed ? 1 : 0, data.quizScore, data.quizTotal);
    return { success: true };
  });

export const saveAttemptAction = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(
    (input: {
      challengeId: string;
      passed: boolean;
      code: string;
      feedback: string;
    }) => input
  )
  .handler(async ({ data, context }) => {
    db.prepare(`
      INSERT INTO challenge_attempts (user_id, challenge_id, passed, code, feedback)
      VALUES (?, ?, ?, ?, ?)
    `).run(context.userId, data.challengeId, data.passed ? 1 : 0, data.code, data.feedback);
    return { success: true };
  });
