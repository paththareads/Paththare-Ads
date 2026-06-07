import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";
import crypto from "crypto";
import { sendSMS } from "@/lib/sendSms";
import { buildAdSubmitSMS } from "@/lib/buildSmsMessage";

const resend = new Resend(process.env.RESEND_API_KEY);

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { advertiser, advertisement } = data;

    // --- VALIDATION ---
    if (!advertiser || !advertisement) {
      return NextResponse.json(
        { error: "Missing advertiser or advertisement data" },
        { status: 400 },
      );
    } else {
    }

    // ✅ Step 1: Create or find advertiser
    // let advertiserRecord = await prisma.advertisers.findFirst({
    //   where: {
    //     email: advertiser.email,
    //     nic: advertiser.nic,
    //   },
    // });

    // if (!advertiserRecord) {
    let advertiserRecord = await prisma.advertisers.create({
      data: {
        name: advertiser.name,
        nic: advertiser.nic,
        phone: advertiser.phone,
        email: advertiser.email,
        address: advertiser.address,
      },
    });
    // }

    async function generateAdReferenceNumber(
      prisma: PrismaClient,
      newspaperSerialNo: number,
    ) {
      // 1️⃣ First 5 digits (newspaper prefix)
      const prefix = newspaperSerialNo.toString().padStart(5, "0");

      // 2️⃣ Find the latest reference number for this newspaper
      const lastAd = await prisma.advertisements.findFirst({
        where: {
          reference_number: {
            startsWith: prefix,
          },
        },
        orderBy: {
          reference_number: "desc",
        },
        select: {
          reference_number: true,
        },
      });

      // 3️⃣ Calculate next sequence
      let nextNumber = 1;

      if (lastAd) {
        const last11Digits = lastAd.reference_number.slice(5); // after prefix
        nextNumber = Number(last11Digits) + 1;
      }

      // 4️⃣ Pad to 11 digits
      const suffix = nextNumber.toString().padStart(11, "0");

      // 5️⃣ Final 16-digit reference
      return prefix + suffix;
    }

    if (!advertisement.newspaper_serial_no) {
      return NextResponse.json(
        { error: "Newspaper serial number is required" },
        { status: 400 },
      );
    }

    let referenceNumber: string;
    let attempts = 0;

    while (true) {
      try {
        referenceNumber = await generateAdReferenceNumber(
          prisma,
          advertisement.newspaper_serial_no,
        );
        break;
      } catch (err) {
        attempts++;
        if (attempts > 3) throw err;
      }
    }

    const rawToken = crypto.randomBytes(24).toString("hex");
    const trackingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/ads/track/${referenceNumber}?t=${rawToken}`;
    const cleanedLink = trackingLink.replace(/^(https?:\/\/)?[^/]+\/?/, "");

    // ✅ Step 3: Create advertisement entry
    const adRecord = await prisma.advertisements.create({
      data: {
        reference_number: referenceNumber,
        advertiser_id: advertiserRecord.advertiser_id,
        newspaper_name: advertisement.newspaper_name,
        // newspaper_name: "Change this later",
        ad_type: advertisement.ad_type,
        classified_category: advertisement.classified_category || null,
        subcategory: advertisement.subcategory || null,
        publish_date: new Date(advertisement.publish_date),
        advertisement_text: advertisement.advertisement_text,
        background_color: advertisement.background_color ?? false,
        post_in_web: advertisement.post_in_web ?? false,
        upload_image: advertisement.upload_image || null,
        uploaded_images: advertisement.uploaded_images || [],
        special_notes: advertisement.special_notes || null,
        price: advertisement.price ? parseFloat(advertisement.price) : null,
        status: "Pending",
        newspaper_serial_no: advertisement.newspaper_serial_no,
        ad_type_id: advertisement.ad_type_id ?? null,
        tracking_link: cleanedLink,
      },
    });

    // ✅ Step 3.1: Create casual ad details (ONLY if ad type is "casual")
    if (advertisement.ad_type === "casual") {
      await prisma.casual_ads.create({
        data: {
          reference_number: referenceNumber,
          ad_size: advertisement.ad_size, // adSizeType from formData
          no_of_columns: advertisement.no_of_columns,
          ad_height: advertisement.ad_height,
          color_option: advertisement.color_option,
          has_artwork: advertisement.has_artwork,
          need_artwork: advertisement.need_artwork,
          section_id: advertisement.section_id,
          no_of_boxes: advertisement.no_boxes,
        },
      });
    } else {
      await prisma.classified_ads.create({
        data: {
          reference_number: referenceNumber,
          is_publish_eng: advertisement.is_publish_eng ?? false,
          is_publish_tam: advertisement.is_publish_tam ?? false,
          is_publish_sin: advertisement.is_publish_sin ?? false,
          is_publish_sin_eng: advertisement.is_publish_sin_eng ?? false,
          is_publish_sin_tam: advertisement.is_publish_sin_tam ?? false,
          is_publish_eng_tam: advertisement.is_publish_eng_tam ?? false,
          is_priority: advertisement.is_priority ?? false,
          is_co_paper: advertisement.is_co_paper ?? false,
          is_int_bw: advertisement.is_int_bw ?? false,
          is_int_fc: advertisement.is_int_fc ?? false,
          is_int_highlight: advertisement.is_int_highlight ?? false,
          district: advertisement.district ?? "",
          province: advertisement.province ?? "",
          vehicle_brand: advertisement.vehicle_brand ?? "",
        },
      });
    }

    // ✅ Step 4: Add initial status history
    await prisma.ad_status_history.create({
      data: {
        reference_number: referenceNumber,
        status: "Pending",
      },
    });

    // ✅ Step 5: Add initial ad review history (first attempt)
    await prisma.ad_review_history.create({
      data: {
        reference_number: referenceNumber,
        attempt: 1,
        advertisement_text: advertisement.advertisement_text,
        requested_revision_text: null,
        reviewed_by: null,
        status_now: "Pending",
      },
    });

    // Step 6: Create tracking token + send email
    // const rawToken = crypto.randomBytes(24).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // expires in 7 days

    await prisma.tracking_tokens.create({
      data: {
        ad_id: adRecord.ad_id,
        reference: referenceNumber,
        email: advertiser.email,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });

    // Construct tracking link
    // const trackingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/ads/track/${referenceNumber}?t=${rawToken}`;

    // Send email (test mode)
    //   const { data: emailData, error: emailError } = await resend.emails.send({
    //     from: "onboarding@resend.dev",
    //     to: advertiser.email,
    //     subject: "TEST: Your Advertisement Submission – Track Status",
    //     html: `
    //   <h2>Thank you for submitting your advertisement!</h2>
    //   <p><b>Reference:</b> ${referenceNumber}</p>
    //   <p>Track here: <a href="${trackingLink}" target="_blank">${trackingLink}</a></p>
    // `,
    //   });

    //   if (emailError) {
    //     console.error("Email send failed:", emailError);
    //   } else {
    //     console.log("Email sent:", emailData);
    //   }

    // Send SMS
    let to = "user";
    let status = "pending";
    const smsMessageUser = buildAdSubmitSMS({
      referenceNumber,
      trackingLink,
      to,
      status,
    });

    const smsResUser = await sendSMS({
      to: advertiser.phone,
      message: smsMessageUser ?? "",
    });

    if (!smsResUser.success) {
      console.error("User SMS failed:", smsResUser.error);
    } else {
      console.log("User SMS sent successfully");

      to = "admin";
      const smsMessageAdmin = buildAdSubmitSMS({
        referenceNumber,
        trackingLink,
        to,
        status,
      });
      const config = await prisma.admin_config.findFirst();
      const adminNumber = config?.phone || "";

      const smsResAdmin = await sendSMS({
        to: adminNumber,
        message: smsMessageAdmin ?? "",
      });
      if (!smsResAdmin.success) {
        console.error("Admin SMS failed:", smsResUser.error);
      } else {
        console.log("Admin SMS sent successfully");
      }
    }

    return NextResponse.json({
      success: true,
      message: "Advertisement submitted for review.",
      reference_number: referenceNumber,
      tracking_link: trackingLink,
      ad_id: adRecord.ad_id,
    });
  } catch (err) {
    console.error("Submit Ad Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
