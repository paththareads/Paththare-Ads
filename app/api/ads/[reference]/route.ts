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
      const { print_url } = body;

      if (!print_url) {
        return resolve(
          NextResponse.json(
            { error: "print_url is required" },
            { status: 400 },
          ),
        );
      }

      const updated = await prisma.advertisements.update({
        where: {
          reference_number: reference,
        },
        data: {
          print_url,
          updated_at: new Date(),
        },
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
