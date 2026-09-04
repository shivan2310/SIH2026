import { createServerFn } from "@tanstack/react-start";
import { getSessionUserId, createSession, destroySession } from "./server";
import { db } from "../db/client";
import bcrypt from "bcryptjs";

export const getAuthSession = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await getSessionUserId();
  if (!userId) return { user: null };

  const user = db.prepare("SELECT id, email FROM users WHERE id = ?").get(userId) as {
    id: string;
    email: string;
  } | undefined;

  return { user: user ?? null };
});

export const getUserProfile = createServerFn({ method: "GET" })
  .validator((input: { userId?: string }) => input)
  .handler(async ({ data: { userId } }) => {
    if (!userId) return null;

    const profile = db
      .prepare("SELECT display_name as displayName, avatar_url as avatarUrl FROM profiles WHERE id = ?")
      .get(userId) as { displayName: string | null; avatarUrl: string | null } | undefined;

    const roleData = db
      .prepare("SELECT role FROM user_roles WHERE user_id = ?")
      .get(userId) as { role: string } | undefined;

    return {
      displayName: profile?.displayName ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      role: roleData?.role ?? null,
    };
  });

export const signIn = createServerFn({ method: "POST" })
  .validator((input: { email: string; password: string }) => input)
  .handler(async ({ data: { email, password } }) => {
    const user = db.prepare("SELECT id, password_hash FROM users WHERE email = ?").get(email) as {
      id: string;
      password_hash: string;
    } | undefined;

    if (!user) throw new Error("Invalid credentials");

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new Error("Invalid credentials");

    await createSession(user.id);
    return { success: true };
  });

export const signUp = createServerFn({ method: "POST" })
  .validator((input: { email: string; password: string }) => input)
  .handler(async ({ data: { email, password } }) => {
    try {
      const id = crypto.randomUUID();
      const hash = await bcrypt.hash(password, 10);
      
      db.prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)").run(id, email, hash);
      db.prepare("INSERT INTO profiles (id, display_name) VALUES (?, ?)").run(id, email.split("@")[0]);
      
      await createSession(id);
      return { success: true };
    } catch (err: any) {
      if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
        throw new Error("User already exists");
      }
      throw err;
    }
  });

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  destroySession();
  return { success: true };
});

