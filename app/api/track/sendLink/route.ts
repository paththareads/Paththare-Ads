// app/api/track/sendLink/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";
import { generateTokenPlain, hashToken } from "@/lib/token";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY!);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(req: Request) {
  const { reference, email } = await req.json();
  if (!reference || !email)
    return NextResponse.json({ ok: false, error: "missing" }, { status: 400 });

  const ad = await prisma.advertisements.findUnique({
    where: { reference_number: reference },
  });
  if (!ad)
    return NextResponse.json(
      { ok: false, error: "ad_not_found" },
      { status: 404 }
    );

  // create token
  const plain = generateTokenPlain(32);
  const tokenHash = hashToken(plain);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30-day token

  await prisma.tracking_tokens.create({
    data: {
      ad_id: ad.ad_id,
      reference,
      email,
      token_hash: tokenHash,
      expires_at: expiresAt,
    },
  });

  const trackingUrl = `${APP_URL}/ads/track/${reference}?t=${plain}`;

  // send email via Resend
  await resend.emails.send({
    from: "PaththaReads <onboarding@resend.dev>", // change in production after verifying domain
    to: email,
    subject: `Track your ad ${reference} — PaththaReads`,
    html: `
      <p>Hi,</p>
      <p>Thanks for posting your ad. Track progress and resubmit edits here:</p>
      <p><a href="${trackingUrl}">${trackingUrl}</a></p>
      <p>This link expires on ${expiresAt.toISOString().slice(0, 10)} (UTC).</p>
      <p>If you didn't post this ad or have questions, reply to this email.</p>
    `,
  });

  return NextResponse.json({ ok: true, trackingUrlSentTo: email });
}
