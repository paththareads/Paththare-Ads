import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: { params: Promise<{ "newspaper-id": string }> },
) {
  const resolvedParams = await context.params;
  const newspaperId = resolvedParams["newspaper-id"];

  if (!newspaperId) {
    return new Response(JSON.stringify({ error: "Missing newspaperId" }), {
      status: 400,
    });
  }

  try {
    const adTypes = await prisma.ad_types.findMany({
      where: { newspaper_id: newspaperId },
      include: {
        ad_type_categories: true,
        ad_sections: {
          orderBy: { id: "asc" },
          include: {
            ad_section_sizes: {
              orderBy: { id: "asc" },
            },
            ad_section_box_pricing: {
              orderBy: { id: "asc" },
            },
          },
        },
      },
      orderBy: { key: "asc" },
    });

    // Attach subcategories for each ad_type
    const adTypesWithSubcats = await Promise.all(
      adTypes.map(async (adType) => {
        const categoriesWithSubcats = await Promise.all(
          adType.ad_type_categories.map(async (cat) => {
            const adCategory = await prisma.ad_categories.findUnique({
              where: { name: cat.category },
              include: { ad_sub_categories: true },
            });
            return {
              category: cat.category,
              subCategories: adCategory?.ad_sub_categories || [],
            };
          }),
        );

        return {
          ...adType,
          categories: categoriesWithSubcats,
          sections: adType.ad_sections.map((sec) => ({
            id: sec.id,
            name: sec.name,
            extraNotes: sec.extra_notes,
            isAvailable: sec.is_available,
            isSingleColumn: sec.is_single_column,
            sizes: sec.ad_section_sizes.map((sz) => ({
              id: sz.id,
              sizeType: sz.size_type,
              width: Number(sz.width),
              height: Number(sz.height),
              colorOption: sz.color_option,
              price: Number(sz.price),
              isAvailable: sz.is_available,
            })),
            boxPricing:
              sec.ad_section_box_pricing.length > 0
                ? sec.ad_section_box_pricing.map((bp) => ({
                    id: bp.id,
                    adSectionId: bp.ad_section_id,
                    boxNumber: bp.box_number,
                    boxNumberDec: Number(bp.box_number_dec),
                    price: Number(bp.price),
                    extraNote1: bp.extra_note_1 ?? null,
                    extraNote2: bp.extra_note_2 ?? null,
                  }))
                : [],
          })),
        };
      }),
    );

    return new Response(JSON.stringify(adTypesWithSubcats), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Failed to fetch ad types" }), {
      status: 500,
    });
  }
}
