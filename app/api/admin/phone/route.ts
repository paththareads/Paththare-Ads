import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET
export async function GET() {
  const config = await prisma.admin_config.findFirst();

  return NextResponse.json({
    phone: config?.phone || "",
  });
}

// POST (update)
export async function POST(req: Request) {
  const { phone } = await req.json();

  if (!phone) {
    return NextResponse.json(
      { error: "Phone is required" },
      { status: 400 }
    );
  }

  let config = await prisma.admin_config.findFirst();

  if (config) {
    config = await prisma.admin_config.update({
      where: { id: config.id },
      data: { phone },
    });
  } else {
    config = await prisma.admin_config.create({
      data: { phone },
    });
  }

  return NextResponse.json({ success: true });
}