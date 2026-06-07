import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const categoryName = req.nextUrl.searchParams.get("categoryName");

    if (!categoryName) {
      return NextResponse.json(
        { error: "Missing categoryName" },
        { status: 400 },
      );
    }

    const category = await prisma.ad_categories.findUnique({
      where: { name: categoryName },
      include: {
        ad_sub_categories: {
          select: {
            name: true,
            classification_number: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    const subcategories = category.ad_sub_categories.map((sub) => ({
      name: sub.name,
      classification_number: sub.classification_number,
    }));

    return NextResponse.json({ subcategories });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
