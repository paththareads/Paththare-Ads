import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const ads = await prisma.advertisements.findMany({
    select: {
      reference_number: true,
      advertiser_id: true,
      newspaper_name: true,
      newspaper_serial_no: true,

      ad_type: true,
      classified_category: true,
      subcategory: true,
      ad_types: {
        select: {
          count_first_words: true,
        },
      },

      publish_date: true,
      created_at: true,
      updated_at: true,

      advertisement_text: true,
      background_color: true,
      post_in_web: true,
      upload_image: true,
      uploaded_images: true,
      special_notes: true,

      price: true,
      status: true,
      print_url: true,

      advertisers: {
        select: {
          name: true,
          nic: true,
          phone: true,
          address: true,
        },
      },

      newspapers: {
        select: {
          name: true,
          id: true,
          language: true,
          publisher_email: true,
        },
      },

      casual_ads: {
        select: {
          ad_size: true,
          no_of_columns: true,
          ad_height: true,
          color_option: true,
          has_artwork: true,
          need_artwork: true,
          no_of_boxes: true,
          ad_sections: {
            select: {
              id: true,
              name: true,
              extra_notes: true,
              supports_box_ads: true,
              max_boxes: true,
            },
          },
        },
      },

      classified_ads: {
        select: {
          is_publish_eng: true,
          is_publish_tam: true,
          is_publish_sin: true,
          is_publish_sin_eng: true,
          is_publish_sin_tam: true,
          is_publish_eng_tam: true,
          is_co_paper: true,
          is_int_bw: true,
          is_int_fc: true,
          is_int_highlight: true,
          is_priority: true,
          district: true,
          province: true,
          vehicle_brand: true,
        },
      },

      payment_ads: {
        orderBy: { created_at: "desc" },
        take: 1, // latest payment only
        select: {
          id: true,
          file_path: true,
          original_filename: true,
          amount: true,
          payment_date: true,
          verified_by: true,
          status: true,
          remarks: true,
          created_at: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  const formattedAds = ads.map((ad) => ({
    reference_number: ad.reference_number,

    newspaper_name: ad.newspapers?.name ?? ad.newspaper_name ?? "—",
    language: ad.newspapers?.language,
    publisher_email: ad.newspapers?.publisher_email,

    ad_type: ad.ad_type,
    classified_category: ad.classified_category,
    subcategory: ad.subcategory,
    count_first_words: ad.ad_types?.count_first_words ?? null,

    publish_date: ad.publish_date,
    created_at: ad.created_at,
    updated_at: ad.updated_at,

    advertisement_text: ad.advertisement_text,
    background_color: ad.background_color,
    post_in_web: ad.post_in_web,
    upload_image: ad.upload_image,
    uploaded_images: ad.uploaded_images,
    special_notes: ad.special_notes,

    price: ad.price,
    status: ad.status,
    print_url: ad.print_url,

    advertiser_name: ad.advertisers?.name ?? "—",
    advertiser_nic: ad.advertisers?.nic ?? "—",
    advertiser_phone: ad.advertisers?.phone ?? "—",
    advertiser_address: ad.advertisers?.address ?? "—",

    casual_ad: ad.casual_ads
      ? {
          ad_size: ad.casual_ads.ad_size,
          no_of_columns: ad.casual_ads.no_of_columns,
          ad_height: ad.casual_ads.ad_height,
          color_option: ad.casual_ads.color_option,
          has_artwork: ad.casual_ads.has_artwork,
          need_artwork: ad.casual_ads.need_artwork,
          no_of_boxes: ad.casual_ads.no_of_boxes,
          section: ad.casual_ads.ad_sections ?? null,
        }
      : null,

    classified_ad:
      ad.classified_ads.length > 0
        ? {
            is_publish_eng: ad.classified_ads[0].is_publish_eng,
            is_publish_tam: ad.classified_ads[0].is_publish_tam,
            is_publish_sin: ad.classified_ads[0].is_publish_sin,
            is_publish_sin_eng: ad.classified_ads[0].is_publish_sin_eng,
            is_publish_sin_tam: ad.classified_ads[0].is_publish_sin_tam,
            is_publish_eng_tam: ad.classified_ads[0].is_publish_eng_tam,
            is_co_paper: ad.classified_ads[0].is_co_paper,
            is_int_bw: ad.classified_ads[0].is_int_bw,
            is_int_fc: ad.classified_ads[0].is_int_fc,
            is_int_highlight: ad.classified_ads[0].is_int_highlight,
            is_priority: ad.classified_ads[0].is_priority,
            district: ad.classified_ads[0].district,
            province: ad.classified_ads[0].province,
            vehicle_brand: ad.classified_ads[0].vehicle_brand,
          }
        : null,

    payment:
      ad.payment_ads.length > 0
        ? {
            amount: ad.payment_ads[0].amount,
            status: ad.payment_ads[0].status,
            payment_date: ad.payment_ads[0].payment_date,
            verified_by: ad.payment_ads[0].verified_by,
            remarks: ad.payment_ads[0].remarks,
            file_path: ad.payment_ads[0].file_path,
            original_filename: ad.payment_ads[0].original_filename,
            created_at: ad.payment_ads[0].created_at,
          }
        : null,
  }));

  return NextResponse.json(formattedAds);
}

export async function PATCH(req: NextRequest) {
  const {
    reference_number,
    advertisement_text,
    status,
    special_notes,
    post_in_web,
  } = await req.json();

  const updatedAd = await prisma.advertisements.update({
    where: { reference_number },
    data: {
      advertisement_text,
      status,
      special_notes,
      post_in_web,
      updated_at: new Date(),
    },
  });

  await prisma.ad_status_history.create({
    data: {
      reference_number,
      status,
    },
  });

  return NextResponse.json(updatedAd);
}
