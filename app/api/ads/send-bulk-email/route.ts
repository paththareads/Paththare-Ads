import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import axios from "axios";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { to, subject, body, ads } = await req.json();

    if (!to || !subject || !body || !ads) {
      return NextResponse.json(
        {
          error: "Missing required fields",
        },
        { status: 400 },
      );
    }

    // SMTP transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Store generated PDF attachments
    const attachments: any[] = [];

    // Create one PDF per advertisement
    for (const ad of ads) {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      /**
       * =====================================
       * 1. ADD PRINT URL AS FIRST PAGE(S)
       * =====================================
       */
      if (ad.print_url) {
        try {
          const printPdfBytes = await axios.get(ad.print_url, {
            responseType: "arraybuffer",
          });

          const printPdfDoc = await PDFDocument.load(printPdfBytes.data);

          const copiedPages = await pdfDoc.copyPages(
            printPdfDoc,
            printPdfDoc.getPageIndices(),
          );

          copiedPages.forEach((page) => {
            const newPage = pdfDoc.addPage(page);

            const { width, height } = newPage.getSize();

            // Optional: reference label on print pages
            // newPage.drawText(`REF: ${ad.reference_number}`, {
            //   x: width - 220,
            //   y: height - 30,
            //   size: 14,
            //   font,
            //   color: rgb(1, 0, 0),
            // });
          });
        } catch (err) {
          console.error("Failed to load print PDF:", ad.print_url, err);
        }
      }

      /**
       * =====================================
       * 2. ADD UPLOADED IMAGES AS PAGES
       * =====================================
       */
      const uploadedImages: string[] = ad.uploaded_images || [];

      for (const imageUrl of uploadedImages) {
        try {
          const response = await axios.get(imageUrl, {
            responseType: "arraybuffer",
          });

          const imageBytes = response.data;

          const isPng = imageUrl.toLowerCase().includes(".png");

          const image = isPng
            ? await pdfDoc.embedPng(imageBytes)
            : await pdfDoc.embedJpg(imageBytes);

          const dims = image.scale(1);

          const page = pdfDoc.addPage([dims.width, dims.height]);

          page.drawImage(image, {
            x: 0,
            y: 0,
            width: dims.width,
            height: dims.height,
          });

          page.drawText(`REF: ${ad.reference_number}`, {
            x: dims.width - 220,
            y: dims.height - 30,
            size: 18,
            font,
            color: rgb(1, 0, 0),
          });
        } catch (err) {
          console.error("Image failed:", imageUrl, err);
        }
      }

      /**
       * =====================================
       * 3. FINALIZE PDF
       * =====================================
       */
      const pdfBytes = await pdfDoc.save();

      const filename =
        `${ad.newspaper_name}_${ad.reference_number}.pdf`.replace(/\s+/g, "_");

      attachments.push({
        filename,
        content: Buffer.from(pdfBytes),
        contentType: "application/pdf",
      });
    }

    // Send email
    await transporter.sendMail({
      from: `"Paththare Ads" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: body,
      attachments,
    });

    // latest email sent
    // for (const ad of ads) {
    //   await prisma.$transaction([
    //     prisma.advertisements.update({
    //       where: { reference_number: ad.reference_number },
    //       data: {
    //         emailed_at: new Date(),
    //       },
    //     }),
    //   ]);
    // }

    return NextResponse.json({
      message: "Email sent successfully",
    });
  } catch (err: any) {
    console.error("Error sending publisher email:", err);

    return NextResponse.json(
      {
        error: err.message || "Failed to send email",
      },
      { status: 500 },
    );
  }
}
