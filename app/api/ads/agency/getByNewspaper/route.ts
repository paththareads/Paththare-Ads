import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* =========================
   GET METHOD (Recommended)
   =========================
   Usage:
   /api/agency/getByNewspaper?newspaper_id=DAILY_LANKADEEPA
*/
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const newspaper_id = searchParams.get("newspaper_id");

    if (!newspaper_id) {
      return NextResponse.json(
        { error: "Missing newspaper_id" },
        { status: 400 }
      );
    }

    const agency = await prisma.agency.findFirst({
      where: {
        papers: {
          has: newspaper_id,
        },
      },
    });

    return NextResponse.json({
      publisher_name: agency?.publisher_name ?? null,
      agent_name: agency?.agent_name ?? null,
      ad_text_type: agency?.ad_text_type ?? null,
    });
  } catch (error) {
    console.error("GET agency error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

/* =========================
   POST METHOD (Optional)
   =========================
*/
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { newspaper_id } = body;

    if (!newspaper_id) {
      return NextResponse.json(
        { error: "Missing newspaper_id" },
        { status: 400 }
      );
    }

    const agency = await prisma.agency.findFirst({
      where: {
        papers: {
          has: newspaper_id,
        },
      },
    });

    return NextResponse.json({
      publisher_name: agency?.publisher_name ?? null,
      agent_name: agency?.agent_name ?? null,
      ad_text_type: agency?.ad_text_type ?? null,
    });
  } catch (error) {
    console.error("POST agency error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}