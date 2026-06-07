import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ reference: string }> },
) {
  try {
    const { reference } = await context.params;

    const body = await request.json();
    const { imageUrl, amount } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, message: "Image URL is missing" },
        { status: 400 },
      );
    }

    // Update advertisement status
    await prisma.advertisements.update({
      where: { reference_number: reference },
      data: { status: "PaymentDone" },
    });

    // Save Cloudinary URL 👇 (FIX for comment 101)
    const payment = await prisma.payment_ads.create({
      data: {
        reference_number: reference,
        file_path: imageUrl, // ✅ Cloudinary secure_url
        original_filename: null,
        amount: amount ? Number(amount) : null,
      },
    });

    return NextResponse.json({ success: true, payment });
  } catch (err) {
    console.error("Error submitting payment:", err);
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
