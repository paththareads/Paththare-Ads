import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  // 1️⃣ Find user
  const user = await prisma.users.findFirst({
    where: {
      username,
      is_active: true,
    },
    include: {
      user_roles: {
        include: {
          roles: true,
        },
      },
    },
  });

  if (!user || !user.password_hash) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // 2️⃣ Verify password
  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // 3️⃣ Extract role names (RBAC-ready)
  const roles = user.user_roles.map((ur) => ur.roles.name);

  // 4️⃣ Set auth cookie (simple, secure)
  const res = NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      roles,
    },
  });

  res.cookies.set("admin_auth", "true", {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
  });

  // Optional: store roles (stringified) for middleware later
  res.cookies.set("admin_roles", JSON.stringify(roles), {
    httpOnly: false,
    sameSite: "strict",
    path: "/",
  });
  console.log("roles", roles);

  return res;
}
