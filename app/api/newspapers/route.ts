import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all newspapers
export async function GET() {
  const newspapers = await prisma.newspapers.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      newspaper_img: true,
      name_sinhala: true,
      no_col_per_page: true,
      col_height: true,
      min_ad_height: true,
      language: true,
      tint_additional_charge: true,
      newspaper_status: true,
      newspaper_serial_no: true,
      is_lang_combine_allowed: true,
      combine_eng_price: true,
      combine_tam_price: true,
      combine_eng_tam_price: true,
      combine_sin_price: true,
      combine_sin_eng_price: true,
      combine_sin_tam_price: true,
      allowed_weekdays: true,
      allowed_month_days: true,
      publisher_email: true,
      lm_image: true,
      lm_description: true,
      ad_time_limit: true,
      day_before: true,
      date_before: true,
      created_at: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // 🔁 Match frontend key names
  const formatted = newspapers.map((n) => ({
    id: n.id,
    name: n.name,
    type: n.type,
    newspaperimg: n.newspaper_img,
    name_sinhala: n.name_sinhala,
    no_col_per_page: n.no_col_per_page,
    col_height: n.col_height,
    min_ad_height: n.min_ad_height,
    language: n.language,
    tint_additional_charge: n.tint_additional_charge,
    newspaper_serial_no: n.newspaper_serial_no,
    is_lang_combine_allowed: n.is_lang_combine_allowed,
    combine_eng_price: n.combine_eng_price,
    combine_tam_price: n.combine_tam_price,
    combine_eng_tam_price: n.combine_eng_tam_price,
    combine_sin_price: n.combine_sin_price,
    combine_sin_eng_price: n.combine_sin_eng_price,
    combine_sin_tam_price: n.combine_sin_tam_price,
    allowed_weekdays: n.allowed_weekdays || [],
    allowed_month_days: n.allowed_month_days || [],
    publisher_email: n.publisher_email,
    created_at: n.created_at,
    lm_image: n.lm_image,
    lm_description: n.lm_description,
    ad_time_limit: n.ad_time_limit,
    day_before: n.day_before,
  }));

  return NextResponse.json(formatted);
}

//Create newspaper
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      id,
      name,
      type,
      no_col_per_page,
      col_width,
      col_height,
      min_ad_height,
      tint_additional_charge,
      newspaper_img,
      language,
      name_sinhala,
      is_lang_combine_allowed,
      combine_eng_price,
      combine_tam_price,
      combine_eng_tam_price,
      combine_sin_tam_price,
      combine_sin_price,
      combine_sin_eng_price,
      allowed_month_days = [],
      allowed_weekdays = [],
      publisher_email,
      lm_image,
      lm_description,
      ad_time_limit,
      day_before,
      date_before,
      ad_types = [], // optional
    } = body;

    /* ---------- Basic validation ---------- */
    if (
      !id ||
      !name ||
      !type ||
      no_col_per_page == null ||
      col_width == null ||
      col_height == null ||
      min_ad_height == null ||
      tint_additional_charge == null ||
      is_lang_combine_allowed == null ||
      combine_eng_price == null ||
      combine_tam_price == null ||
      combine_eng_tam_price == null
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    /* ---------- Transaction ---------- */
    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ Create newspaper
      const newspaper = await tx.newspapers.create({
        data: {
          id,
          name,
          type,
          no_col_per_page,
          col_width,
          col_height,
          min_ad_height,
          tint_additional_charge,
          newspaper_img,
          name_sinhala,
          language,
          is_lang_combine_allowed,
          combine_eng_price,
          combine_tam_price,
          combine_eng_tam_price,
          combine_sin_tam_price,
          combine_sin_price,
          combine_sin_eng_price,
          allowed_weekdays,
          allowed_month_days,
          publisher_email,
          lm_image,
          lm_description,
          ad_time_limit,
          day_before,
          date_before,
        },
      });

      // 2️⃣ Create ad types (one by one so we get IDs)
      for (const ad of ad_types) {
        const createdAdType = await tx.ad_types.create({
          data: {
            newspaper_id: id,
            key: ad.key,
            name: ad.name,
            base_type: ad.base_type,
            count_first_words: ad.count_first_words,
            base_price: ad.base_price,
            additional_word_price: ad.additional_word_price,
            tint_color_price: ad.tint_color_price,
            co_paper_price: ad.co_paper_price,
            internet_bw_price: ad.internet_bw_price,
            internet_fc_price: ad.internet_fc_price,
            internet_highlight_price: ad.internet_highlight_price,
            is_allow_combined: ad.is_allow_combined,
            max_words: ad.max_words,
            img_url: ad.img_url ?? null,
            cs_col_bw_price: ad.cs_col_bw_price,
            cs_col_bw_one_color_price: ad.cs_col_bw_one_color_price,
            cs_col_bw_two_color_price: ad.cs_col_bw_two_color_price,
            cs_col_full_color_price: ad.cs_col_full_color_price,
            cs_page_bw_price: ad.cs_page_bw_price,
            cs_page_bw_one_color_price: ad.cs_page_bw_one_color_price,
            cs_page_bw_two_color_price: ad.cs_page_bw_two_color_price,
            cs_page_full_color_price: ad.cs_page_full_color_price,
            is_upload_image: ad.is_upload_image,
            extra_notes1: ad.extra_notes1 ?? null,
            extra_notes2: ad.extra_notes2 ?? null,
            priority_price: ad.priority_price ?? null,
            tax_amount_2: ad.tax_amount ?? null,
          },
        });

        // 3️⃣ Create sections for this ad type
        if (ad.sections && ad.sections.length > 0) {
          for (const section of ad.sections) {
            const createdSection = await tx.ad_sections.create({
              data: {
                ad_type_id: createdAdType.id,
                name: section.name,
                extra_notes: section.extra_notes ?? null,
                is_available: section.is_available,
                is_single_column: section.is_single_column,
                supports_box_ads: section.supports_box_ads ?? false,
                max_boxes: section.max_boxes ?? null,
              },
            });

            // 4️⃣ Create sizes for this section
            if (section.sizes && section.sizes.length > 0) {
              await tx.ad_section_sizes.createMany({
                data: section.sizes.map((sz: any) => ({
                  section_id: createdSection.id,
                  size_type: sz.size_type,
                  width: sz.width ?? 0,
                  height: sz.height ?? 0,
                  color_option: sz.color_option,
                  price: sz.price ?? 0,
                  is_available: sz.is_available,
                })),
              });
            }

            if (
              section.supports_box_ads &&
              section.ad_section_box_pricing &&
              section.ad_section_box_pricing.length > 0
            ) {
              await tx.ad_section_box_pricing.createMany({
                data: section.ad_section_box_pricing.map((bp: any) => ({
                  ad_section_id: createdSection.id,
                  box_number: 1,
                  box_number_dec: bp.box_number,
                  price: bp.price,
                  extra_note_1: bp.extra_note_1 ?? null,
                  extra_note_2: bp.extra_note_2 ?? null,
                })),
              });
            }
          }
        }
      }

      return newspaper;
    });

    return NextResponse.json(
      { message: "Newspaper created successfully", data: result },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("POST /newspapers error:", error);

    return NextResponse.json(
      {
        message: "Failed to create newspaper",
        error: error?.message,
      },
      { status: 500 },
    );
  }
}
