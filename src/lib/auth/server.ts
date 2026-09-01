import { createMiddleware } from "@tanstack/react-start";
import { SignJWT, jwtVerify } from "jose";

const SESSION_SECRET = new TextEncoder().encode(
  process.env["SESSION_SECRET"] || "default-secret-key-change-me-in-production"
);

const COOKIE_NAME = "qlab_session";

export async function getSessionUserId(): Promise<string | null> {
  const { getCookie } = await import("@tanstack/react-start/server");
  const token = getCookie(COOKIE_NAME);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    return payload.sub || null;
  } catch {
    return null;
  }
}

export async function createSession(userId: string) {
  const { setCookie } = await import("@tanstack/react-start/server");
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SESSION_SECRET);

  setCookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function destroySession() {
  const { deleteCookie } = await import("@tanstack/react-start/server");
  deleteCookie(COOKIE_NAME, { path: "/" });
}

export const requireAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const userId = await getSessionUserId();
    if (!userId) {
      throw new Error("Unauthorized: Invalid or missing session");
    }

    return next({
      context: {
        userId,
      },
    });
  }
);
