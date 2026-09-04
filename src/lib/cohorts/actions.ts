import { createServerFn } from "@tanstack/react-start";
import { db } from "../db/client";
import { requireAuth } from "../auth/server";

export const getAssignments = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    // Get all assignments for cohorts the user is a member of
    const assignments = db
      .prepare(`
        SELECT a.id, a.title, a.item_type, a.item_id, a.due_at, a.cohort_id
        FROM assignments a
        INNER JOIN cohort_members cm ON a.cohort_id = cm.cohort_id
        WHERE cm.user_id = ?
        ORDER BY a.due_at ASC
      `)
      .all(context.userId) as any[];

    return assignments;
  });

export const joinCohort = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input: { joinCode: string }) => input)
  .handler(async ({ data, context }) => {
    const cohort = db
      .prepare("SELECT id, name FROM cohorts WHERE join_code = ?")
      .get(data.joinCode) as { id: string; name: string } | undefined;

    if (!cohort) throw new Error("No class found with that code.");

    try {
      db.prepare("INSERT INTO cohort_members (cohort_id, user_id) VALUES (?, ?)").run(
        cohort.id,
        context.userId
      );
      return { success: true, name: cohort.name };
    } catch (err: any) {
      if (err.code === "SQLITE_CONSTRAINT_PRIMARYKEY" || err.code === "SQLITE_CONSTRAINT_UNIQUE") {
        throw new Error("You are already in that class.");
      }
      throw err;
    }
  });

export const getInstructorCohorts = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    return db
      .prepare("SELECT id, name, description, join_code FROM cohorts WHERE instructor_id = ? ORDER BY created_at ASC")
      .all(context.userId) as any[];
  });

export const getInstructorCohortDetails = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((input: { cohortId: string }) => input)
  .handler(async ({ data: { cohortId }, context }) => {
    // Verify instructor
    const cohort = db.prepare("SELECT id FROM cohorts WHERE id = ? AND instructor_id = ?").get(cohortId, context.userId);
    if (!cohort) throw new Error("Unauthorized or not found");

    const assignments = db.prepare("SELECT id, title, item_type, item_id FROM assignments WHERE cohort_id = ?").all(cohortId) as any[];
    
    const members = db.prepare(`
      SELECT cm.user_id, p.display_name 
      FROM cohort_members cm 
      LEFT JOIN profiles p ON cm.user_id = p.id 
      WHERE cm.cohort_id = ?
    `).all(cohortId) as any[];

    const stats = members.map(m => {
      const ls = db.prepare("SELECT completed, quiz_score, quiz_total FROM lesson_progress WHERE user_id = ?").all(m.user_id) as any[];
      const at = db.prepare("SELECT challenge_id, passed FROM challenge_attempts WHERE user_id = ?").all(m.user_id) as any[];
      
      const scored = ls.filter(r => r.quiz_total > 0);
      const quizAvg = scored.length === 0 ? 0 : Math.round((scored.reduce((s, r) => s + r.quiz_score / r.quiz_total, 0) / scored.length) * 100);
      
      return {
        userId: m.user_id,
        name: m.display_name ?? m.user_id.slice(0, 8),
        lessonsDone: ls.filter(r => r.completed).length,
        quizAvg,
        challengesSolved: new Set(at.filter(r => r.passed).map(r => r.challenge_id)).size,
        attempts: at.length,
      };
    });

    return { members, assignments, stats };
  });

export const createCohort = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input: { name: string }) => input)
  .handler(async ({ data: { name }, context }) => {
    const id = crypto.randomUUID();
    const joinCode = (crypto.randomUUID().split("-")[0] ?? "").toUpperCase().slice(0, 6);
    
    db.prepare(
      "INSERT INTO cohorts (id, instructor_id, name, join_code) VALUES (?, ?, ?, ?)"
    ).run(id, context.userId, name, joinCode);
    
    return db.prepare("SELECT id, name, description, join_code FROM cohorts WHERE id = ?").get(id) as any;
  });

export const addAssignment = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input: { cohortId: string; itemType: string; itemId: string; title: string }) => input)
  .handler(async ({ data, context }) => {
    const cohort = db.prepare("SELECT id FROM cohorts WHERE id = ? AND instructor_id = ?").get(data.cohortId, context.userId);
    if (!cohort) throw new Error("Unauthorized");

    const id = crypto.randomUUID();
    db.prepare(
      "INSERT INTO assignments (id, cohort_id, item_type, item_id, title) VALUES (?, ?, ?, ?, ?)"
    ).run(id, data.cohortId, data.itemType, data.itemId, data.title);
    return { success: true };
  });

export const removeAssignment = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    // Check if the assignment belongs to a cohort owned by the user
    const assignment = db.prepare(`
      SELECT a.id FROM assignments a 
      JOIN cohorts c ON a.cohort_id = c.id 
      WHERE a.id = ? AND c.instructor_id = ?
    `).get(data.id, context.userId);
    
    if (!assignment) throw new Error("Unauthorized or not found");

    db.prepare("DELETE FROM assignments WHERE id = ?").run(data.id);
    return { success: true };
  });

