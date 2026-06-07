import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { sendSMS } from "@/lib/sendSms";
import { buildAdSubmitSMS } from "@/lib/buildSmsMessage";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      reference_number,
      status,
      advertisement_text,
      price_change,
      old_price,
    } = body;

    // Send SMS
    // Send SMS
    const referenceNumber = reference_number;
    let to = "";

    // 🔽 Fetch admin number dynamically
    const config = await prisma.admin_config.findFirst();
    const adminNumber = config?.phone || "";

    if (!adminNumber) {
      return NextResponse.json(
        { error: "Admin phone number not configured" },
        { status: 500 }
      );
    }

    // Validate incoming data
    if (!reference_number || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    console.log(
      "Updating ad:",
      reference_number,
      status,
      advertisement_text,
      price_change,
      old_price,
    );

    // Fetch the original ad to get the original text
    const originalAd = await prisma.advertisements.findUnique({
      where: { reference_number }, include: {

        advertisers: true, // 👈 get phone number
      },
    });

    if (!originalAd) {
      return NextResponse.json(
        { error: "Advertisement not found" },
        { status: 404 },
      );
    }

    let trackingLink = originalAd?.tracking_link ?? "";


    // Update the advertisement
    const updatedAd = await prisma.advertisements.update({
      where: { reference_number },
      data: {
        status,
        advertisement_text,
      },
    });

    // Create a history record
    await prisma.ad_status_history.create({
      data: {
        reference_number,
        status,
      },
    });

    // Create a review history record
    await prisma.ad_review_history.create({
      data: {
        reference_number,
        advertisement_text: originalAd.advertisement_text, // original text
        requested_revision_text:
          status === "Revision" ? advertisement_text : null, // only store if revision
        reviewed_by: "Admin", // you can replace with actual admin info if available
        status_now: status,
      },
    });

    if (price_change) {
      await prisma.ad_price_change_history.create({
        data: {
          reference_number,
          old_price: old_price,
          requested_price: price_change.new_price,
          reason: price_change.reason,
          requested_by: "admin",
          status: "PriceChange",
        },
      });

      // Optional: update ad status
      await prisma.advertisements.update({
        where: { reference_number },
        data: { status: "PriceChange", price: price_change.new_price },
      });

      // Sending user sms

      to = "user";
      let status = "priceChange"
      const smsMessageUser = buildAdSubmitSMS({
        referenceNumber,
        trackingLink,
        to, status,
      });

      await sendSMS({
        to: originalAd.advertisers?.phone ?? "",
        message: smsMessageUser ?? "",
      });
    }

    if (status === "Approve" || status === "Approved" || status === "approve" || status === "approved") {
      to = "user"
      const smsMessageAdmin = buildAdSubmitSMS({
        referenceNumber,
        trackingLink,
        to,
        status,
      });

      await sendSMS({
        to: originalAd.advertisers?.phone ?? "",
        message: smsMessageAdmin ?? "",
      });
    }

    if (status === "PaymentPending") {
      await prisma.ad_price_change_history.updateMany({
        where: { reference_number },
        data: { status: "PaymentPending" },
      });

      to = "admin";
      let status = "paymentPending"
      const smsMessageUser = buildAdSubmitSMS({
        referenceNumber,
        trackingLink,
        to, status,
      });

      await sendSMS({
        to: adminNumber,
        message: smsMessageUser ?? "",
      });
    }

    if (status === "PaymentDone" || status === "Resubmit") {
      if (status === "PaymentDone") {
        await prisma.ad_price_change_history.updateMany({
          where: { reference_number },
          data: { status: "PaymentDone" },
        });
      }
      to = "admin"
      const smsMessageAdmin = buildAdSubmitSMS({
        referenceNumber,
        trackingLink,
        to,
        status,
      });

      await sendSMS({
        to: adminNumber,
        message: smsMessageAdmin ?? "",
      });
    }

    if (status === "UpdateImage") {
      to = "user"
      const smsMessageAdmin = buildAdSubmitSMS({
        referenceNumber,
        trackingLink,
        to,
        status,
      });

      await sendSMS({
        to: originalAd.advertisers?.phone ?? "",
        message: smsMessageAdmin ?? "",
      });
    }

    if (status === "Declined") {
      to = "user"
      const smsMessageAdmin = buildAdSubmitSMS({
        referenceNumber,
        trackingLink,
        to,
        status,
      });

      await sendSMS({
        to: originalAd.advertisers?.phone ?? "",
        message: smsMessageAdmin ?? "",
      });
    }

    // if (!smsResUser.success) {
    //   console.error("SMS failed:", smsResUser.error);
    // } else {
    //   console.log("SMS sent successfully");
    // }


    return NextResponse.json({
      success: true,
      message: `Advertisement ${reference_number} updated successfully`,
      ad: updatedAd,
    });
  } catch (error: any) {
    console.error("Error updating ad:", error);
    return NextResponse.json(
      { error: "Failed to update advertisement", details: error.message },
      { status: 500 },
    );
  }
}
