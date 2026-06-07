import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const users = await prisma.users.findMany({
    orderBy: { created_at: "desc" },
  });

  return new Response(JSON.stringify(users), { status: 200 });
}

export async function POST(req: Request) {
  const body = await req.json();
  const roleMap: Record<string, number> = {
    SUPER_ADMIN: 1,
    ADMIN: 2,
    MODERATOR: 3,
    PREMIUM: 4,
    USER: 5,
  };

  if (!body.role || !body.email) {
    return new Response(JSON.stringify({ error: "Missing fields" }), {
      status: 400,
    });
  }

  // Hash password
  let hashedPassword: string | undefined;
  if (body.password) {
    hashedPassword = await bcrypt.hash(body.password, 10);
  }

  // 1️⃣ Create user
  const user = await prisma.users.create({
    data: {
      full_name: body.fullName,
      username: body.username,
      email: body.email,
      phone: body.phone,
      role: body.role, // still store main role in enum
      is_active: body.isActive,
      is_verified: body.isVerified,
      password_hash: hashedPassword,
    },
  });

  // 2️⃣ Create user_roles relationship
  const roleId = roleMap[body.role]; // convert role string to role ID
  if (roleId) {
    await prisma.user_roles.create({
      data: {
        user_id: user.id,
        role_id: roleId,
      },
    });
  }

  return new Response(JSON.stringify(user), { status: 201 });
}
