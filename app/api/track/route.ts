import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hashToken } from "@/lib/token";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const reference = url.searchParams.get("ref");
    const token = url.searchParams.get("t");

    if (!reference || !token) {
      return NextResponse.json(
        { ok: false, error: "missing_params" },
        { status: 400 },
      );
    }

    const tokenHash = hashToken(token);

    const tokenRow = await prisma.tracking_tokens.findFirst({
      where: { reference, token_hash: tokenHash, revoked: false },
    });

    if (!tokenRow) {
      return NextResponse.json(
        { ok: false, error: "invalid_token" },
        { status: 403 },
      );
    }

    if (tokenRow.expires_at < new Date()) {
      return NextResponse.json(
        { ok: false, error: "expired_token" },
        { status: 403 },
      );
    }

    // ✅ Update last_used_at timestamp
    await prisma.tracking_tokens.update({
      where: { id: tokenRow.id },
      data: { last_used_at: new Date() },
    });

    // ✅ Fetch advertisement details + related history
    const ad = await prisma.advertisements.findUnique({
      where: { reference_number: reference },
      include: {
        ad_review_history: { orderBy: { attempt: "desc" }, take: 10 },
        ad_status_history: { orderBy: { updated_at: "desc" }, take: 10 },
        ad_price_change_history: {
          orderBy: { created_at: "desc" },
          take: 1, // 🔑 latest entry only
        },
        advertisers: true,
        ad_types: true,
      },
    });
    console.log(ad);

    if (!ad) {
      return NextResponse.json(
        { ok: false, error: "ad_not_found" },
        { status: 404 },
      );
    }
    const priceHistory = ad.ad_price_change_history as any[];
    const latestPriceChange = priceHistory.length > 0 ? priceHistory[0] : null;

    // Count attempts
    const attempts =
      ad.ad_review_history.length > 0
        ? Math.max(...ad.ad_review_history.map((r) => r.attempt))
        : 0;

    return NextResponse.json({
      ok: true,
      ad: {
        reference_number: ad.reference_number,
        status: ad.status,
        publish_date: ad.publish_date,
        upload_image: ad.upload_image,
        created_at: ad.created_at,
        advertisement_text: ad.advertisement_text,
        attempts,
        price: ad.price,
        latest_price_change: latestPriceChange
          ? {
            requested_price: latestPriceChange.requested_price,
            old_price: latestPriceChange.old_price,
            reason: latestPriceChange.reason,
            status: latestPriceChange.status,
            created_at: latestPriceChange.created_at,
          }
          : null,
        review_history: ad.ad_review_history,
        status_history: ad.ad_status_history,
        advertiser: ad.advertisers
          ? { name: ad.advertisers.name, email: ad.advertisers.email }
          : null,
        ad_types: ad.ad_types
      },
    });
  } catch (err) {
    console.error("Tracking API Error:", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
