import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ---------------- GET ---------------- */
export async function GET() {
  const promos = await prisma.promo_ads.findMany({
    orderBy: { id: "desc" },
  });

  return NextResponse.json({ data: promos });
}

/* ---------------- POST ---------------- */
export async function POST(req: Request) {
  const body = await req.json();

  const promo = await prisma.promo_ads.create({
    data: {
      ad_name: body.ad_name,
      ad_image: body.ad_image,
      ad_public_id_2: body.ad_public_id,
      ad_description: body.ad_description,
      extra_notes_1: body.extra_notes_1,
      is_active: body.is_active,
      is_clickable: body.is_clickable,
    },
  });

  return NextResponse.json({ success: true, promo });
}

/* ---------------- DELETE ---------------- */
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));

  if (!id) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  await prisma.promo_ads.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request) {
  const body = await req.json();

  if (!body.id) {
    return Response.json({ error: "ID required" }, { status: 400 });
  }

  const updated = await prisma.promo_ads.update({
    where: { id: body.id },
    data: {
      ad_name: body.ad_name,
      ad_image: body.ad_image,
      ad_public_id_2: body.ad_public_id,
      ad_description: body.ad_description,
      extra_notes_1: body.extra_notes_1,
      is_active: body.is_active,
      is_clickable: body.is_clickable,
    },
  });

  return Response.json({ success: true, updated });
}
