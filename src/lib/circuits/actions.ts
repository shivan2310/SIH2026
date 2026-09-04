import { createServerFn } from "@tanstack/react-start";
import { db } from "../db/client";
import { requireAuth } from "../auth/server";

export const getCircuit = createServerFn({ method: "GET" })
  .validator((input: { id: string }) => input)
  .handler(async ({ data: { id } }) => {
    const circuit = db
      .prepare("SELECT title, description, is_public as isPublic, data, updated_at FROM circuits WHERE id = ?")
      .get(id) as { title: string; description: string | null; isPublic: number; data: string; updated_at: string } | undefined;
    
    if (!circuit) return null;
    return {
      title: circuit.title,
      description: circuit.description,
      isPublic: Boolean(circuit.isPublic),
      data: JSON.parse(circuit.data),
      updated_at: circuit.updated_at,
    };
  });

export const getCircuitComments = createServerFn({ method: "GET" })
  .validator((input: { circuitId: string }) => input)
  .handler(async ({ data: { circuitId } }) => {
    const comments = db
      .prepare(
        `SELECT c.id, c.body, c.created_at, c.user_id, p.display_name as author
         FROM circuit_comments c
         LEFT JOIN profiles p ON c.user_id = p.id
         WHERE c.circuit_id = ?
         ORDER BY c.created_at ASC`
      )
      .all(circuitId) as any[];
      
    return comments.map(c => ({
      ...c,
      author: c.author ?? "Learner"
    }));
  });

export const postCircuitComment = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input: { circuitId: string; body: string }) => input)
  .handler(async ({ data, context }) => {
    const id = crypto.randomUUID();
    db.prepare(
      "INSERT INTO circuit_comments (id, circuit_id, user_id, body) VALUES (?, ?, ?, ?)"
    ).run(id, data.circuitId, context.userId, data.body);
    return { id };
  });

export const deleteCircuitComment = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const info = db.prepare("DELETE FROM circuit_comments WHERE id = ? AND user_id = ?").run(
      data.id,
      context.userId
    );
    if (info.changes === 0) throw new Error("Unauthorized or not found");
    return { success: true };
  });


export const saveCircuit = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator(
    (input: {
      id?: string;
      title: string;
      description: string | null;
      isPublic: boolean;
      data: any;
    }) => input
  )
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const isPublic = data.isPublic ? 1 : 0;
    const dataStr = JSON.stringify(data.data);
    
    if (data.id) {
      const existing = db.prepare("SELECT user_id FROM circuits WHERE id = ?").get(data.id) as { user_id: string } | undefined;
      if (!existing || existing.user_id !== userId) throw new Error("Unauthorized or not found");
      
      db.prepare(
        "UPDATE circuits SET title = ?, description = ?, is_public = ?, data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).run(data.title, data.description, isPublic, dataStr, data.id);
      return { id: data.id };
    } else {
      const id = crypto.randomUUID();
      db.prepare(
        "INSERT INTO circuits (id, user_id, title, description, is_public, data) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(id, userId, data.title, data.description, isPublic, dataStr);
      return { id };
    }
  });

export const getUserCircuits = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const circuits = db
      .prepare(
        "SELECT id, title, description, data, is_public as is_public, updated_at FROM circuits WHERE user_id = ? ORDER BY updated_at DESC"
      )
      .all(context.userId) as any[];

    return circuits.map((c) => ({
      ...c,
      is_public: Boolean(c.is_public),
      data: JSON.parse(c.data),
    }));
  });

export const toggleCircuitShare = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input: { id: string; isPublic: boolean }) => input)
  .handler(async ({ data, context }) => {
    const info = db.prepare("UPDATE circuits SET is_public = ? WHERE id = ? AND user_id = ?").run(
      data.isPublic ? 1 : 0,
      data.id,
      context.userId
    );
    if (info.changes === 0) throw new Error("Unauthorized or not found");
    return { success: true };
  });

export const deleteCircuit = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const info = db.prepare("DELETE FROM circuits WHERE id = ? AND user_id = ?").run(
      data.id,
      context.userId
    );
    if (info.changes === 0) throw new Error("Unauthorized or not found");
    return { success: true };
  });
export const getSharedCircuit = createServerFn({ method: "GET" })
  .validator((input: { id: string }) => input)
  .handler(async ({ data: { id } }) => {
    const circuit = db
      .prepare("SELECT title, description, data, updated_at FROM circuits WHERE id = ? AND is_public = 1")
      .get(id) as { title: string; description: string | null; data: string; updated_at: string } | undefined;
    
    if (!circuit) return null;
    return {
      title: circuit.title,
      description: circuit.description,
      data: JSON.parse(circuit.data),
      updated_at: circuit.updated_at,
    };
  });
