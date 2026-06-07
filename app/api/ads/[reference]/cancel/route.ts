import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hashToken } from "@/lib/token";

const prisma = new PrismaClient();

export async function POST(
  req: Request,
  context: { params: Promise<{ reference: string }> }
) {
  const { reference } = await context.params;

  try {
    const { token } = await req.json();

    if (!token)
      return NextResponse.json(
        { ok: false, error: "missing_token" },
        { status: 400 }
      );

    const tokenHash = hashToken(token);
    const tokenRow = await prisma.tracking_tokens.findFirst({
      where: { reference, token_hash: tokenHash, revoked: false },
    });

    if (!tokenRow || tokenRow.expires_at < new Date()) {
      return NextResponse.json(
        { ok: false, error: "invalid_or_expired_token" },
        { status: 403 }
      );
    }

    // Update status to Cancelled
    await prisma.$transaction([
      prisma.advertisements.update({
        where: { reference_number: reference },
        data: { status: "Cancelled", updated_at: new Date() },
      }),
      prisma.ad_status_history.create({
        data: { reference_number: reference, status: "Cancelled" },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Cancel Ad Error:", err);
    return NextResponse.json(
      { ok: false, error: "internal_server_error" },
      { status: 500 }
    );
  }
}
