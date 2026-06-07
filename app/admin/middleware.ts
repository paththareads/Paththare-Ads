import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { redis } from "@/lib/redis";
import { SESSION_COOKIE_NAME } from "@/lib/cookies";

async function verifySession(sessionId: string | undefined) {
  if (!sessionId) return null;

  const data = await redis.get(`sess:${sessionId}`);
  if (!data) return null;

  const parsed = JSON.parse(data) as { userId: string; createdAt: string };
  return parsed;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login page
  if (pathname.startsWith("/admin/login")) return NextResponse.next();

  // Get session from cookie
  const sessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(sessionId);

  if (!session) {
    // Redirect to login
    const loginUrl = new URL("/admin/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated → continue to /admin
  return NextResponse.next();
}

// Apply to all /admin routes
export const config = {
  matcher: ["/admin/:path*"],
};
