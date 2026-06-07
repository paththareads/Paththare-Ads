// app/api/ads/[reference]/confirm/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hashToken } from "@/lib/token";


const prisma = new PrismaClient();

export async function POST(
  req: Request,
  context: { params: Promise<{ reference: string }> }
) {
  // ✅ Await params (required for Next.js 15+)
  const { reference } = await context.params;

  const { token } = await req.json();
  const referenceNumber = reference
  // let to = ""


  if (!token)
    return NextResponse.json(
      { ok: false, error: "missing_token" },
      { status: 400 }
    );

  const tokenHash = hashToken(token);
  const tokenRow = await prisma.tracking_tokens.findFirst({
    where: { reference, token_hash: tokenHash, revoked: false },
  });

  if (!tokenRow || tokenRow.expires_at < new Date())
    return NextResponse.json(
      { ok: false, error: "invalid_token" },
      { status: 403 }
    );

  // find latest review with requested_revision_text
  const latestReview = await prisma.ad_review_history.findFirst({
    where: {
      reference_number: reference,
      requested_revision_text: { not: null },
    },
    orderBy: { created_at: "desc" },
  });

  if (!latestReview)
    return NextResponse.json(
      { ok: false, error: "no_requested_revision_found" },
      { status: 400 }
    );

  // If the user did NOT edit anything, they can confirm.
  await prisma.$transaction([
    prisma.advertisements.update({
      where: { reference_number: reference },
      data: {
        advertisement_text: latestReview.requested_revision_text!,
        status: "Approved",
      },
    }),
    prisma.ad_review_history.create({
      data: {
        reference_number: reference,
        attempt: latestReview.attempt + 1,
        advertisement_text: latestReview.requested_revision_text!,
        requested_revision_text: null,
        reviewed_by: latestReview.reviewed_by,
        status_now: "Approved",
      },
    }),
    prisma.ad_status_history.create({
      data: { reference_number: reference, status: "Approved" },
    }),


  ]);



  return NextResponse.json({ ok: true });
}
