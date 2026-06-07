import { prisma } from "./prisma";
import { redis } from "./redis";
import crypto from "crypto";
import { cookies as nextCookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "./cookies";

// ---------------- Create Session ----------------
export async function createSession(userId: string) {
  const sessionId = crypto.randomUUID();
  const now = new Date();
  const expires = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7); // 7 days

  // Store session in Redis
  await redis.set(
    `sess:${sessionId}`,
    JSON.stringify({ userId, createdAt: now.toISOString() }),
    "EX",
    60 * 60 * 24 * 7
  );

  return { sessionId, expires };
}

// ---------------- Get Session ----------------
export async function getSession() {
  // Await cookie store (Next.js App Router)
  const cookieStore = await nextCookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) return null;

  const data = await redis.get(`sess:${sessionId}`);
  if (!data) return null;

  const parsed = JSON.parse(data) as { userId: string; createdAt: string };

  // Prisma fetch user and roles
  const user = await prisma.users.findUnique({
    where: { id: parsed.userId },
    include: {
      user_roles: {
        include: {
          roles: true, // includes role name
        },
      },
    },
  });

  if (!user) return null;

  return { sessionId, user };
}

// ---------------- Require Admin ----------------
export async function requireAdmin() {
  const ses = await getSession();
  if (!ses?.user) throw new Error("UNAUTHORIZED");

  const roles = ses.user.user_roles.map((r) => r.roles.name);

  if (!roles.includes("SUPER_ADMIN") && !roles.includes("ADMIN")) {
    throw new Error("FORBIDDEN");
  }

  return ses;
}

// ---------------- Optional: Require Login ----------------
export async function requireLogin() {
  const ses = await getSession();
  if (!ses?.user) throw new Error("UNAUTHORIZED");
  return ses;
}
