// app/api/ads/[reference]/resubmit/route.ts
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
    const { token, newText, upload_image } = await req.json();

    // ✅ must have token AND at least text OR image
    if (!token || (!newText && !upload_image)) {
      return NextResponse.json(
        { ok: false, error: "missing_parameters" },
        { status: 400 }
      );
    }

    // 🔐 verify token
    const tokenHash = hashToken(token);
    const tokenRow = await prisma.tracking_tokens.findFirst({
      where: {
        reference,
        token_hash: tokenHash,
        revoked: false,
      },
    });

    if (!tokenRow) {
      return NextResponse.json(
        { ok: false, error: "invalid_token" },
        { status: 403 }
      );
    }

    if (tokenRow.expires_at < new Date()) {
      return NextResponse.json(
        { ok: false, error: "expired_token" },
        { status: 403 }
      );
    }

    // 📦 fetch ad + history
    const ad = await prisma.advertisements.findUnique({
      where: { reference_number: reference },
      include: { ad_review_history: true },
    });

    if (!ad) {
      return NextResponse.json(
        { ok: false, error: "ad_not_found" },
        { status: 404 }
      );
    }

    // 🔢 next attempt number
    const nextAttempt =
      (ad.ad_review_history.length
        ? Math.max(...ad.ad_review_history.map((r) => r.attempt))
        : 0) + 1;

    // 🧠 decide next status
    const isImageOnly = !!upload_image && !newText;
    const nextStatus = isImageOnly ? "Resubmitted" : "Resubmitted";

    // ✅ transaction
    await prisma.$transaction([
      prisma.advertisements.update({
        where: { reference_number: reference },
        data: {
          ...(newText && { advertisement_text: newText }),
          ...(upload_image && { upload_image }),
          status: nextStatus,
          updated_at: new Date(),
        },
      }),

      prisma.ad_review_history.create({
        data: {
          reference_number: reference,
          attempt: nextAttempt,
          advertisement_text: newText ?? ad.advertisement_text,
          requested_revision_text: null,
          // upload_image: upload_image ?? null,
          status_now: nextStatus,
        },
      }),

      prisma.ad_status_history.create({
        data: {
          reference_number: reference,
          status: nextStatus,
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ Error in resubmit route:", err);
    return NextResponse.json(
      { ok: false, error: "internal_server_error" },
      { status: 500 }
    );
  }
}
