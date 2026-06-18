import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function PATCH(
  req: NextRequest,
  context: { params: Promise<{ reference: string }> },
) {
  return new Promise<NextResponse>(async (resolve) => {
    try {
      // ✅ unwrap params correctly
      const { reference } = await context.params;

      if (!reference) {
        return resolve(
          NextResponse.json(
            { error: "Reference number is required" },
            { status: 400 },
          ),
        );
      }

      const body = await req.json();
      const { print_url, is_read } = body;

      const updateData: any = {
        updated_at: new Date(),
      };

      if (print_url !== undefined) {
        updateData.print_url = print_url;
      }

      if (is_read !== undefined) {
        updateData.is_read = is_read;
      }

      const updated = await prisma.advertisements.update({
        where: {
          reference_number: reference,
        },
        data: updateData,
      });

      return resolve(
        NextResponse.json({
          message: "Print URL updated successfully",
          data: updated,
        }),
      );
    } catch (error) {
      console.error("Error updating print_url:", error);

      return resolve(
        NextResponse.json(
          { error: "Failed to update print_url" },
          { status: 500 },
        ),
      );
    }
  });
}
