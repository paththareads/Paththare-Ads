import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ---------------- GET (Paginated) ---------------- */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 10);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.newspaper_ad_types.findMany({
      skip,
      take: limit,
      orderBy: { id: "asc" },
    }),
    prisma.newspaper_ad_types.count(),
  ]);

  return NextResponse.json({
    data,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  });
}

/* ---------------- POST (Create / Update) ---------------- */
export async function POST(req: Request) {
  const body = await req.json();

  const {
    id,
    ad_type_name,
    ad_type_name_code,
    is_available = true,
  } = body;

  const code =
    ad_type_name_code ||
    ad_type_name.toLowerCase().replace(/\s+/g, "_");

  const record = id
    ? await prisma.newspaper_ad_types.update({
        where: { id },
        data: {
          ad_type_name,
          ad_type_name_code: code,
          is_available,
        },
      })
    : await prisma.newspaper_ad_types.create({
        data: {
          ad_type_name,
          ad_type_name_code: code,
          is_available,
        },
      });

  return NextResponse.json(record);
}
