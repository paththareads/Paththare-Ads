export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import "regenerator-runtime/runtime";
import { NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { createCanvas, registerFont } from "canvas";

const SINHALA_REGEX = /[\u0D80-\u0DFF]/;
const TAMIL_REGEX = /[\u0B80-\u0BFF]/;
const MAX_WORDS = 70;
const CROSS_SIZE = 6;
const CROSS_SIZE_SMALL = 4;
const CROSS_SIZE_SMALL_XS = 3;

//color option
let color_x = 0;
let color_y = 0;
const TICK_SIZE = 3;
const BOX_Y = 570;

// Register Sinhala font
registerFont(
  path.join(process.cwd(), "public/fonts/NotoSansSinhala-Regular.ttf"),
  {
    family: "NotoSansSinhala",
  },
);

registerFont(
  path.join(process.cwd(), "public/fonts/NotoSansTamil-Regular.ttf"),
  {
    family: "NotoSansTamil",
  },
);

const provincePositions: Record<string, number> = {
  western: 66,
  central: 180,
  southern: 123,
  northern: 412,
  eastern: 412,
  north_western: 351,
  north_central: 468,
  uva: 238,
  sabaragamuwa: 294,
};

function drawProvinceTick(page: any, province: string) {
  if (!province) {
    return;
  }
  const x = provincePositions[province.toLowerCase()];

  if (!x) {
    console.warn(`Province "${province}" not found`);
    return;
  }

  // Draw tick ✓
  page.drawLine({
    start: { x: x - TICK_SIZE, y: BOX_Y + TICK_SIZE }, // top-left of the tick
    end: { x: x, y: BOX_Y }, // bottom-middle
    thickness: 1,
  });

  page.drawLine({
    start: { x: x, y: BOX_Y }, // bottom-middle
    end: { x: x + TICK_SIZE * 2, y: BOX_Y + TICK_SIZE }, // top-right
    thickness: 1,
  });
}

// Helper to format advertiser name
const formatAdvertiserName = (name: string, maxLength = 30) => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  let formatted = "";
  if (parts.length > 3) {
    formatted = `${parts[0][0]}. ${parts[1][0]}. ${parts[parts.length - 1]}`;
  } else {
    formatted = name;
  }
  return [...formatted].slice(0, maxLength).join("");
};

// Helper to get first word for signature
function getSignature(str: string): string {
  if (!str) return "";
  return str.trim().split(/\s+/)[0];
}

// Split text into words or sentences
const normalizeAdText = (text: string, type: string | null) => {
  if (!text) return [];
  const words = text.normalize("NFC").trim().split(/\s+/);
  if (type === "sentence") {
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += 5) {
      chunks.push(words.slice(i, i + 5).join(" "));
    }
    return chunks;
  }
  return words;
};

async function drawSmartText({
  page,
  pdfDoc,
  text,
  x,
  y,
  fontSize,
  englishFont,
  scale = 0.5,
}: {
  page: any;
  pdfDoc: PDFDocument;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  englishFont: any;
  scale?: number;
}) {
  if (!text) return;

  const cleanText = String(text);

  if (SINHALA_REGEX.test(cleanText)) {
    const pngBuffer = renderSinhalaTextToImage(cleanText, fontSize * 2);

    const pngImage = await pdfDoc.embedPng(pngBuffer);
    const dims = pngImage.scale(scale);

    page.drawImage(pngImage, {
      x,
      y: y - dims.height,
      width: dims.width,
      height: dims.height,
    });
  } else {
    page.drawText(cleanText, {
      x,
      y,
      size: fontSize,
      font: englishFont,
    });
  }
}

// async function drawAdTextBlock(
//   page: any,
//   pdfDoc: PDFDocument,
//   adText: string,
//   x: number,
//   startY: number,
//   gap: number,
//   sinhalaFont: any,
//   englishFont: any,
//   fontSize: number,
//   maxCharsPerLine: number,
//   maxLines: number,
// ) {
//   if (!adText?.trim()) return;

//   const words = adText.trim().split(/\s+/);
//   const lines: string[] = [];
//   let currentLine = "";

//   // Break words into lines based on max characters
//   for (const word of words) {
//     const testLine = currentLine ? `${currentLine} ${word}` : word;

//     if (testLine.length <= maxCharsPerLine) {
//       currentLine = testLine;
//     } else {
//       lines.push(currentLine);
//       currentLine = word;

//       if (lines.length === maxLines) break;
//     }
//   }

//   if (currentLine && lines.length < maxLines) lines.push(currentLine);

//   // Draw each line
//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i];
//     const yPos = startY - i * gap;

//     if (SINHALA_REGEX.test(line)) {
//       // Render Sinhala line as PNG
//       const pngBuffer = renderSinhalaTextToImage(line, fontSize * 2); // double font size for better resolution
//       const pngImage = await pdfDoc.embedPng(pngBuffer);
//       const dims = pngImage.scale(0.5); // scale down to fit

//       page.drawImage(pngImage, {
//         x,
//         y: yPos - dims.height, // adjust for image height
//         width: dims.width,
//         height: dims.height,
//       });
//     } else {
//       // Draw English text
//       page.drawText(line, {
//         x,
//         y: yPos,
//         size: fontSize,
//         font: englishFont,
//       });
//     }
//   }
// }

const renderSinhalaTextToImageLine = (text: string, fontSize = 20): Buffer => {
  const canvas = createCanvas(800, 200);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "black";
  ctx.font = `${fontSize}px "NotoSansSinhala"`;
  if (TAMIL_REGEX.test(text)) {
    console.log("IT IS TAMILLLLL");
    ctx.font = `${fontSize}px "NotoSansTamil"`;
  }

  const words = text.split(/\s+/);
  let line = "";
  let y = fontSize;

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    const { width } = ctx.measureText(testLine);

    if (width > 780) {
      ctx.fillText(line, 0, y);
      line = word;
      y += fontSize * 1.2; // line spacing inside the PNG
    } else {
      line = testLine;
    }
  });

  if (line) ctx.fillText(line, 0, y);

  return canvas.toBuffer("image/png");
};

/**
 * Draws a block of ad text line by line.
 */
export async function drawAdTextBlock(
  page: any,
  pdfDoc: PDFDocument,
  adText: string,
  x: number,
  startY: number,
  lineGap: number,
  columnWidth: number, // width of text column for wrapping
  sinhalaFont: any,
  englishFont: any,
  fontSize: number,
  maxLines: number = 100,
) {
  if (!adText?.trim()) return;

  const words = adText.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (SINHALA_REGEX.test(word)) {
      // Sinhala: approximate visual width using characters * fontSize * 0.6
      const approxWidth = testLine.length * fontSize * 0.55;
      if (approxWidth <= columnWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
        if (lines.length >= maxLines) break;
      }
    } else {
      // English: simple width estimate
      const approxWidth = testLine.length * fontSize * 0.5;
      if (approxWidth <= columnWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
        if (lines.length >= maxLines) break;
      }
    }
  }

  if (currentLine && lines.length < maxLines) lines.push(currentLine);

  // Draw each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const yPos = startY - i * lineGap;

    if (SINHALA_REGEX.test(line)) {
      const pngBuffer = renderSinhalaTextToImageLine(line, fontSize * 2); // double font size for clarity
      const pngImage = await pdfDoc.embedPng(pngBuffer);
      const dims = pngImage.scale(0.5); // scale down to fit

      page.drawImage(pngImage, {
        x,
        y: yPos - dims.height,
        width: dims.width,
        height: dims.height,
      });
    } else {
      page.drawText(line, {
        x,
        y: yPos,
        size: fontSize,
        font: englishFont,
      });
    }
  }
}

const getTodayYMD = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
};

const formatColorType = (value: string): string => {
  switch (value?.toLowerCase()) {
    case "full":
      return "F/C";
    case "bw":
      return "BW";
    case "bw1":
      return "BW+1 color";
    case "bw2":
      return "BW+2 colors";
    default:
      return value; // fallback (safe)
  }
};

// Publisher-specific coordinates
const getCoordinates = (publisherName: string) => {
  switch (publisherName?.toLowerCase()) {
    case "wijeya_newspapers":
      return {
        COLUMN_X: [24, 137, 252, 362, 474],
        ROW_Y: [
          543, 520, 496, 475, 454, 432, 409, 387, 364, 343, 320, 298, 276, 254,
        ],
      };
    case "associated_newspapers":
      return {
        COLUMN_X: [25, 132, 245, 360, 472],
        ROW_Y: [310, 290, 260, 230, 200, 170, 145, 115, 85],
      };
    case "liberty_publishers":
      return {
        COLUMN_X: [30, 137, 248, 361, 473],
        ROW_Y: [
          483, 460, 437, 415, 393, 370, 347, 327, 305, 283, 261, 239, 217,
        ],
      };
    case "ceylon_newspapers":
      return {
        COLUMN_X: [35, 137, 252, 362, 474],
        ROW_Y: [
          578, 557, 533, 512, 491, 471, 451, 431, 411, 391, 371, 351, 331, 311,
          291,
        ],
      };
    case "express_newspapers":
      return {
        COLUMN_X: [35, 137, 252, 362, 474],
        ROW_Y: [
          578, 557, 533, 512, 491, 471, 451, 431, 411, 391, 371, 351, 331, 311,
          291,
        ],
      };
    default:
      return {
        COLUMN_X: [24, 137, 252, 362, 474],
        ROW_Y: [
          539, 516, 492, 471, 450, 428, 405, 383, 360, 339, 316, 294, 272, 250,
        ],
      };
  }
};

const shortenNewspaperName = (name: string, maxLength = 14) => {
  if (!name || name.length <= maxLength) return name;

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) return name.slice(0, maxLength);

  const firstWordInitial = parts[0][0];
  const rest = parts.slice(1).join(" ");

  return `${firstWordInitial}/${rest}`;
};

// Render Sinhala text to PNG
const renderSinhalaTextToImage = (text: string, fontSize = 30): Buffer => {
  console.log("IT IS TAMILLLLL");
  const canvas = createCanvas(800, 200);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "black";
  ctx.font = `${fontSize}px "NotoSansSinhala"`;
  if (TAMIL_REGEX.test(text)) {
    console.log("IT IS TAMILLLLL");
    ctx.font = `${fontSize}px "NotoSansTamil"`;
  }

  const words = text.split(/\s+/);
  let line = "";
  let y = fontSize;

  words.forEach((word) => {
    const testLine = line ? line + " " + word : word;
    const { width } = ctx.measureText(testLine);
    if (width > 780) {
      ctx.fillText(line, 0, y);
      line = word;
      y += fontSize * 1.2;
    } else {
      line = testLine;
    }
  });
  if (line) ctx.fillText(line, 0, y);

  return canvas.toBuffer("image/png");
};

export async function POST(req: Request) {
  try {
    const fontkit = require("@pdf-lib/fontkit").default;

    const {
      /* ---------------- Core identifiers ---------------- */
      reference_number = "",
      newspaper_name = "",
      newspaper_id = "",
      language = "",

      /* ---------------- Advertiser details ---------------- */
      advertiser_name = "",
      advertiser_nic = null,
      advertiser_phone = null,
      advertiser_address = null,

      /* ---------------- Ad classification ---------------- */
      ad_type = "",
      category = null,
      subcategory = null,
      count_first_words = null,

      /* ---------------- Dates ---------------- */
      publish_date = null,
      created_at = "",
      updated_at = null,

      /* ---------------- Text & content ---------------- */
      advertisement_text = "",
      advertisement_words = [],
      word_count = 0,
      special_notes = null,

      /* ---------------- Flags ---------------- */
      background_color = null,
      post_in_web = null,

      /* ---------------- Media ---------------- */
      upload_image = null,

      /* ---------------- Pricing & status ---------------- */
      price = null,
      status = "",

      /* ---------------- Casual Ad ---------------- */
      casual_ad = null,

      /* ---------------- Classified Ad ---------------- */
      classified_ad = null,
      attachments = null,
    } = await req.json();

    const effective_word_count = casual_ad
      ? ""
      : Math.max(word_count ?? 0, count_first_words ?? 0);

    // Find agency for newspaper
    const agency = newspaper_id
      ? await prisma.agency.findFirst({
          where: { papers: { has: newspaper_id } },
        })
      : null;

    if (!agency?.publisher_name)
      return NextResponse.json(
        { error: "No publisher found" },
        { status: 400 },
      );

    // Load PDF template
    const pdfFileName =
      agency.publisher_name === "associated_newspapers" &&
      (ad_type === "marriage" ||
        ad_type === "name_notice" ||
        ad_type === "casual" ||
        ad_type === "death_notice" ||
        ad_type === "photo_classified")
        ? `${agency.publisher_name}_classified_2.pdf`
        : ad_type === "classified"
          ? `${agency.publisher_name}_classified.pdf`
          : `${agency.publisher_name}.pdf`;
    const pdfPath = path.join(process.cwd(), "public/pdf", pdfFileName);
    if (!fs.existsSync(pdfPath))
      return NextResponse.json(
        { error: "PDF template not found" },
        { status: 404 },
      );

    let existingPdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    pdfDoc.registerFontkit(fontkit);

    const sinhalaFontBytes = fs.readFileSync(
      path.join(process.cwd(), "public/fonts/NotoSansSinhala-Regular.ttf"),
    );
    const sinhalaFont = await pdfDoc.embedFont(sinhalaFontBytes);
    const englishFont = await pdfDoc.embedFont("Helvetica");

    const page = pdfDoc.getPages()[0];

    const publisherName = agency?.publisher_name ?? "";

    async function drawTextOrSinhalaImage(
      page: any,
      pdfDoc: PDFDocument,
      text: string,
      x: number,
      y: number,
      font: any, // English font
      sinhalaFont: any, // Sinhala font
      fontSize = 10,
      scale = 0.5, // optional scaling for PNG
    ) {
      if (!text) return;

      if (SINHALA_REGEX.test(text)) {
        // Render Sinhala text as image
        const pngBuffer = renderSinhalaTextToImage(text, fontSize); // returns Buffer
        const pngImage = await pdfDoc.embedPng(pngBuffer);
        const dims = pngImage.scale(scale);

        page.drawImage(pngImage, {
          x,
          y: y - dims.height, // shift down by image height
          width: dims.width,
          height: dims.height,
        });
      } else {
        // Draw English/Latin text normally
        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
        });
      }
    }

    let finalAdvertisementText = advertisement_text;

    if (
      attachments?.changedText &&
      advertisement_text !== attachments.changedText
    ) {
      finalAdvertisementText = attachments.changedText;
    }

    if (publisherName === "wijeya_newspapers") {
      // Draw newspaper cross
      if (newspaper_id === "SUNDAY_LANKADEEPA") {
        // Draw a cross
        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 776 - CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 776 + CROSS_SIZE },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 776 + CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 776 - CROSS_SIZE },
          thickness: 1,
        });

        page.drawText(String(publish_date ?? ""), {
          x: 500,
          y: 775,
          size: 10,
          font: SINHALA_REGEX.test(String(publish_date))
            ? sinhalaFont
            : englishFont,
        });

        if (classified_ad?.is_publish_eng) {
          page.drawLine({
            start: { x: 487 - CROSS_SIZE, y: 693 - CROSS_SIZE },
            end: { x: 487 + CROSS_SIZE, y: 693 + CROSS_SIZE },
            thickness: 1,
          });

          page.drawLine({
            start: { x: 487 - CROSS_SIZE, y: 693 + CROSS_SIZE },
            end: { x: 487 + CROSS_SIZE, y: 693 - CROSS_SIZE },
            thickness: 1,
          });

          page.drawText(String(publish_date ?? ""), {
            x: 500,
            y: 694,
            size: 10,
            font: SINHALA_REGEX.test(String(publish_date))
              ? sinhalaFont
              : englishFont,
          });
        }
      }
      if (newspaper_id === "DAILY_LANKADEEPA") {
        // Draw a cross
        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 757 - CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 757 + CROSS_SIZE },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 757 + CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 757 - CROSS_SIZE },
          thickness: 1,
        });

        page.drawText(String(publish_date ?? ""), {
          x: 500,
          y: 759,
          size: 10,
          font: SINHALA_REGEX.test(String(publish_date))
            ? sinhalaFont
            : englishFont,
        });
      }

      if (newspaper_id === "SUNDAY_TIMES") {
        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 692 - CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 692 + CROSS_SIZE },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 692 + CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 692 - CROSS_SIZE },
          thickness: 1,
        });

        page.drawText(String(publish_date ?? ""), {
          x: 500,
          y: 694,
          size: 10,
          font: SINHALA_REGEX.test(String(publish_date))
            ? sinhalaFont
            : englishFont,
        });

        if (classified_ad?.is_publish_sin) {
          page.drawLine({
            start: { x: 487 - CROSS_SIZE, y: 776 - CROSS_SIZE },
            end: { x: 487 + CROSS_SIZE, y: 776 + CROSS_SIZE },
            thickness: 1,
          });

          page.drawLine({
            start: { x: 487 - CROSS_SIZE, y: 776 + CROSS_SIZE },
            end: { x: 487 + CROSS_SIZE, y: 776 - CROSS_SIZE },
            thickness: 1,
          });

          page.drawText(String(publish_date ?? ""), {
            x: 500,
            y: 775,
            size: 10,
            font: SINHALA_REGEX.test(String(publish_date))
              ? sinhalaFont
              : englishFont,
          });
        }
      }

      if (newspaper_id === "SIRIKATHA") {
        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 733 - CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 733 + CROSS_SIZE },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 733 + CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 733 - CROSS_SIZE },
          thickness: 1,
        });

        page.drawText(String(publish_date ?? ""), {
          x: 500,
          y: 732,
          size: 10,
          font: SINHALA_REGEX.test(String(publish_date))
            ? sinhalaFont
            : englishFont,
        });
      }

      if (newspaper_id === "WIJEYA") {
        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 718 - CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 718 + CROSS_SIZE },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 718 + CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 718 - CROSS_SIZE },
          thickness: 1,
        });

        page.drawText(String(publish_date ?? ""), {
          x: 500,
          y: 719,
          size: 10,
          font: SINHALA_REGEX.test(String(publish_date))
            ? sinhalaFont
            : englishFont,
        });
      }

      if (newspaper_id === "DAILY_MIRROR") {
        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 666 - CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 666 + CROSS_SIZE },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 666 + CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 666 - CROSS_SIZE },
          thickness: 1,
        });

        page.drawText(String(publish_date ?? ""), {
          x: 500,
          y: 667,
          size: 10,
          font: SINHALA_REGEX.test(String(publish_date))
            ? sinhalaFont
            : englishFont,
        });
      }

      if (newspaper_id === "DAILY_FT") {
        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 654 - CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 654 + CROSS_SIZE },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 654 + CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 654 - CROSS_SIZE },
          thickness: 1,
        });

        page.drawText(String(publish_date ?? ""), {
          x: 500,
          y: 654,
          size: 10,
          font: SINHALA_REGEX.test(String(publish_date))
            ? sinhalaFont
            : englishFont,
        });
      }

      if (newspaper_id === "BILINDU") {
        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 642 - CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 642 + CROSS_SIZE },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 642 + CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 642 - CROSS_SIZE },
          thickness: 1,
        });
      }

      page.drawText(String(effective_word_count ?? ""), {
        x: 310,
        y: 705,
        size: 10,
        font: SINHALA_REGEX.test(String(effective_word_count))
          ? sinhalaFont
          : englishFont,
      });

      if (background_color) {
        // Draw a cross
        if (newspaper_id === "SUNDAY_TIMES") {
          page.drawLine({
            start: { x: 573 - CROSS_SIZE, y: 685 - CROSS_SIZE },
            end: { x: 573 + CROSS_SIZE, y: 685 + CROSS_SIZE },
            thickness: 1,
          });

          page.drawLine({
            start: { x: 573 - CROSS_SIZE, y: 685 + CROSS_SIZE },
            end: { x: 573 + CROSS_SIZE, y: 685 - CROSS_SIZE },
            thickness: 1,
          });
        }
        if (newspaper_id === "SUNDAY_LANKADEEPA") {
          page.drawLine({
            start: {
              x: 572 - CROSS_SIZE_SMALL_XS,
              y: 772 - CROSS_SIZE_SMALL_XS,
            },
            end: { x: 572 + CROSS_SIZE_SMALL_XS, y: 772 + CROSS_SIZE_SMALL_XS },
            thickness: 1,
          });

          page.drawLine({
            start: {
              x: 572 - CROSS_SIZE_SMALL_XS,
              y: 772 + CROSS_SIZE_SMALL_XS,
            },
            end: { x: 572 + CROSS_SIZE_SMALL_XS, y: 772 - CROSS_SIZE_SMALL_XS },
            thickness: 1,
          });
        }
      }

      // Draw casual ad dimensions
      if (ad_type === "casual" && casual_ad?.no_of_boxes === "0") {
        if (casual_ad?.ad_size === "custom") {
          page.drawText(String(casual_ad?.ad_height ?? ""), {
            x: 358,
            y: 755,
            size: 10,
            font: SINHALA_REGEX.test(String(casual_ad?.ad_height))
              ? sinhalaFont
              : englishFont,
          });

          page.drawText(" x ", {
            x: 377,
            y: 755,
            size: 10,
            font: SINHALA_REGEX.test(" x ") ? sinhalaFont : englishFont,
          });

          page.drawText(String(casual_ad?.no_of_columns ?? ""), {
            x: 395,
            y: 755,
            size: 10,
            font: SINHALA_REGEX.test(String(casual_ad?.no_of_columns))
              ? sinhalaFont
              : englishFont,
          });
        } else {
          page.drawText(String(casual_ad?.ad_size ?? ""), {
            x: 358,
            y: 755,
            size: 10,
            font: SINHALA_REGEX.test(String(casual_ad?.ad_size))
              ? sinhalaFont
              : englishFont,
          });
        }

        const color_opt = formatColorType(casual_ad?.color_option);
        page.drawText(String(color_opt ?? ""), {
          x: 356,
          y: 648,
          size: 8,
          font: SINHALA_REGEX.test(String(color_opt))
            ? sinhalaFont
            : englishFont,
        });
      }
      if (ad_type === "casual" && casual_ad?.no_of_boxes !== "0") {
        page.drawText("Box Ad", {
          x: 360,
          y: 755,
          size: 10,
          font: SINHALA_REGEX.test("Box Ad") ? sinhalaFont : englishFont,
        });

        page.drawText(String(casual_ad?.no_of_boxes) + " boxes", {
          x: 360,
          y: 745,
          size: 10,
          font: SINHALA_REGEX.test(String(casual_ad?.no_of_boxes) + " boxes")
            ? sinhalaFont
            : englishFont,
        });

        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 680 - CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 680 + CROSS_SIZE },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 487 - CROSS_SIZE, y: 680 + CROSS_SIZE },
          end: { x: 487 + CROSS_SIZE, y: 680 - CROSS_SIZE },
          thickness: 1,
        });

        page.drawText(String(publish_date ?? ""), {
          x: 500,
          y: 679,
          size: 10,
          font: SINHALA_REGEX.test(String(publish_date))
            ? sinhalaFont
            : englishFont,
        });

        if (background_color) {
          page.drawLine({
            start: { x: 573 - CROSS_SIZE, y: 685 - CROSS_SIZE },
            end: { x: 573 + CROSS_SIZE, y: 685 + CROSS_SIZE },
            thickness: 1,
          });

          page.drawLine({
            start: { x: 573 - CROSS_SIZE, y: 685 + CROSS_SIZE },
            end: { x: 573 + CROSS_SIZE, y: 685 - CROSS_SIZE },
            thickness: 1,
          });
        }
      }

      // admin extra notes - wijeya newspapers
      {
        if (attachments.noInsertions !== "0") {
          page.drawText(
            "Insert " + String(attachments.noInsertions ?? "") + " days",
            {
              x: 503,
              y: 755,
              size: 10,
              font: SINHALA_REGEX.test(String(attachments.noInsertions))
                ? sinhalaFont
                : englishFont,
              color: rgb(0, 0.5, 0.9),
            },
          );
        }
        page.drawText(String(attachments.classification ?? ""), {
          x: 94,
          y: 682,
          size: 10,
          font: SINHALA_REGEX.test(String(attachments.classification))
            ? sinhalaFont
            : englishFont,
          color: rgb(0, 0.5, 0.9),
        });

        if (attachments.isCarsOthers !== null) {
          if (attachments.isCarsOthers === "c") {
            page.drawLine({
              start: { x: 263 - CROSS_SIZE, y: 663 - CROSS_SIZE },
              end: { x: 263 + CROSS_SIZE, y: 663 + CROSS_SIZE },
              thickness: 1,
              color: rgb(0, 0.5, 0.9),
            });

            page.drawLine({
              start: { x: 263 - CROSS_SIZE, y: 663 + CROSS_SIZE },
              end: { x: 263 + CROSS_SIZE, y: 663 - CROSS_SIZE },
              thickness: 1,
              color: rgb(0, 0.5, 0.9),
            });
          }
          if (attachments.isCarsOthers === "o") {
            page.drawLine({
              start: { x: 330 - CROSS_SIZE, y: 663 - CROSS_SIZE },
              end: { x: 330 + CROSS_SIZE, y: 663 + CROSS_SIZE },
              thickness: 1,
              color: rgb(0, 0.5, 0.9),
            });

            page.drawLine({
              start: { x: 330 - CROSS_SIZE, y: 663 + CROSS_SIZE },
              end: { x: 330 + CROSS_SIZE, y: 663 - CROSS_SIZE },
              thickness: 1,
              color: rgb(0, 0.5, 0.9),
            });
          }
        }

        page.drawText(String(attachments.size ?? ""), {
          x: 357,
          y: 750,
          size: 10,
          font: SINHALA_REGEX.test(String(attachments.size))
            ? sinhalaFont
            : englishFont,
          color: rgb(0, 0.5, 0.9),
        });

        //naturally wrapping lines
        const text = String(attachments.specialPosition ?? "");

        // split by words
        const words = text.split(" ");

        const lines: string[] = [];
        let currentLine = "";

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;

          if (testLine.length <= 10) {
            currentLine = testLine;
          } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word; // start new line
          }
        }

        // push last line
        if (currentLine) lines.push(currentLine);

        // draw
        lines.forEach((line, index) => {
          page.drawText(line, {
            x: 357,
            y: 707 - index * 12,
            size: 9,
            font: SINHALA_REGEX.test(line) ? sinhalaFont : englishFont,
            color: rgb(0, 0.5, 0.9),
          });
        });

        page.drawText(String(attachments.color ?? ""), {
          x: 357,
          y: 647,
          size: 10,
          font: SINHALA_REGEX.test(String(attachments.color))
            ? sinhalaFont
            : englishFont,
          color: rgb(0, 0.5, 0.9),
        });

        page.drawText(String(attachments.adminNotes ?? ""), {
          x: 37,
          y: 274,
          size: 10,
          font: SINHALA_REGEX.test(String(attachments.adminNotes))
            ? sinhalaFont
            : englishFont,
          color: rgb(0, 0.5, 0.9),
        });
      }

      // Draw category
      page.drawText(String(subcategory ?? ""), {
        x: 86,
        y: 680,
        size: 10,
        font: SINHALA_REGEX.test(String(subcategory))
          ? sinhalaFont
          : englishFont,
      });

      //district
      page.drawText(String(classified_ad?.district ?? ""), {
        x: 259,
        y: 680,
        size: 10,
        font: SINHALA_REGEX.test(String(classified_ad?.district ?? ""))
          ? sinhalaFont
          : englishFont,
      });

      drawProvinceTick(page, classified_ad?.province);

      page.drawText(String(classified_ad?.vehicle_brand ?? ""), {
        x: 80,
        y: 662,
        size: 10,
        font: SINHALA_REGEX.test(String(classified_ad?.vehicle_brand ?? ""))
          ? sinhalaFont
          : englishFont,
      });

      // Draw advertiser info
      await drawSmartText({
        page,
        pdfDoc,
        text: formatAdvertiserName(advertiser_name),
        x: 220,
        y: 110,
        fontSize: 10,
        englishFont,
      });

      await drawSmartText({
        page,
        pdfDoc,
        text: advertiser_address ?? "",
        x: 115,
        y: 95,
        fontSize: 10,
        englishFont,
      });

      await drawSmartText({
        page,
        pdfDoc,
        text: advertiser_phone ?? "",
        x: 57,
        y: 59,
        fontSize: 9,
        englishFont,
      });

      await drawSmartText({
        page,
        pdfDoc,
        text: advertiser_nic ?? "",
        x: 324,
        y: 59,
        fontSize: 9,
        englishFont,
      });

      await drawSmartText({
        page,
        pdfDoc,
        text: getSignature(advertiser_name),
        x: 213,
        y: 23,
        fontSize: 9,
        englishFont,
      });

      await drawSmartText({
        page,
        pdfDoc,
        text: reference_number ?? "",
        x: 341,
        y: 18,
        fontSize: 9,
        englishFont,
      });

      await drawSmartText({
        page,
        pdfDoc,
        text: publish_date ?? "",
        x: 500,
        y: 775,
        fontSize: 10,
        englishFont,
      });

      if (ad_type.key !== "casual") {
        // Normalize ad text
        const normalizedText = normalizeAdText(
          finalAdvertisementText,
          agency.ad_text_type,
        );
        const { COLUMN_X, ROW_Y } = getCoordinates(agency.publisher_name);
        const wordsToPrint = Math.min(
          normalizedText.length,
          MAX_WORDS,
          COLUMN_X.length * ROW_Y.length,
        );

        // Draw ad text
        for (let i = 0; i < wordsToPrint; i++) {
          const col = i % COLUMN_X.length;
          const row = Math.floor(i / COLUMN_X.length);
          if (row >= ROW_Y.length) break;

          const text = normalizedText[i];
          // wijeya newspapers - text print
          // if (SINHALA_REGEX.test(text)) {
          //   const pngBuffer = renderSinhalaTextToImage(text, 22);
          //   const pngImage = await pdfDoc.embedPng(pngBuffer);
          //   const dims = pngImage.scale(0.5); // adjust scale to fit

          //   page.drawImage(pngImage, {
          //     x: COLUMN_X[col],
          //     y: ROW_Y[row] - dims.height, // shift down by image height
          //     width: dims.width,
          //     height: dims.height,
          //   });
          // } else {
          //   page.drawText(text, {
          //     x: COLUMN_X[col],
          //     y: ROW_Y[row],
          //     size: 10,
          //     font: englishFont,
          //   });
          // }
          const pngBuffer = renderSinhalaTextToImage(text, 22);
          const pngImage = await pdfDoc.embedPng(pngBuffer);
          const dims = pngImage.scale(0.5);

          page.drawImage(pngImage, {
            x: COLUMN_X[col],
            y: ROW_Y[row] - dims.height,
            width: dims.width,
            height: dims.height,
          });
        }
      }
    }
    if (publisherName === "associated_newspapers") {
      if (
        ad_type === "name_notice" ||
        ad_type === "marriage" ||
        ad_type === "casual" ||
        ad_type === "death_notice" ||
        ad_type === "photo_classified"
      ) {
        //admin notes - attachments
        {
          page.drawText(String(attachments.classification2 ?? ""), {
            x: 290,
            y: 531,
            size: 10,
            font: SINHALA_REGEX.test(String(attachments.classification2 ?? ""))
              ? sinhalaFont
              : englishFont,
            color: rgb(0, 0.5, 0.9),
          });
          page.drawText(String(attachments.page ?? ""), {
            x: 290,
            y: 514,
            size: 10,
            font: SINHALA_REGEX.test(String(attachments.page ?? ""))
              ? sinhalaFont
              : englishFont,
            color: rgb(0, 0.5, 0.9),
          });
          page.drawText(String(attachments.position ?? ""), {
            x: 290,
            y: 496,
            size: 10,
            font: SINHALA_REGEX.test(String(attachments.position ?? ""))
              ? sinhalaFont
              : englishFont,
            color: rgb(0, 0.5, 0.9),
          });

          const text = String(attachments.adminNotes ?? "");

          // split into words
          const words = text.split(" ");

          const lines: string[] = [];

          for (let i = 0; i < words.length; i += 15) {
            lines.push(words.slice(i, i + 7).join(" "));
          }

          // draw lines
          lines.forEach((line, index) => {
            page.drawText(line, {
              x: 30,
              y: 185 - index * 12,
              size: 10,
              font: SINHALA_REGEX.test(line) ? sinhalaFont : englishFont,
              color: rgb(0, 0.5, 0.9),
            });
          });
        }

        const displayName = shortenNewspaperName(newspaper_name);
        page.drawText(String(displayName ?? ""), {
          x: 38.8,
          y: 534,
          size: 9,
          font: SINHALA_REGEX.test(String(displayName))
            ? sinhalaFont
            : englishFont,
        });

        page.drawText(String(publish_date ?? ""), {
          x: 100,
          y: 534,
          size: 10,
          font: SINHALA_REGEX.test(String(publish_date))
            ? sinhalaFont
            : englishFont,
        });

        // Draw category -  associated
        page.drawText(String(subcategory ?? ""), {
          x: 312,
          y: 534,
          size: 10,
          font: SINHALA_REGEX.test(String(subcategory))
            ? sinhalaFont
            : englishFont,
        });

        // page.drawText(String(price ?? ""), {
        //   x: 372,
        //   y: 534,
        //   size: 10,
        //   font: SINHALA_REGEX.test(String(price)) ? sinhalaFont : englishFont,
        // });

        page.drawText(String(reference_number) ?? "", {
          x: 298,
          y: 724,
          size: 8,
          font: SINHALA_REGEX.test(String(reference_number) ?? "")
            ? sinhalaFont
            : englishFont,
        });

        // Draw date
        const todayDate = getTodayYMD();
        page.drawText(String(todayDate ?? ""), {
          x: 244,
          y: 639,
          size: 10,
          font: SINHALA_REGEX.test(String(todayDate))
            ? sinhalaFont
            : englishFont,
        });

        if (classified_ad?.is_co_paper) {
          page.drawLine({
            start: { x: 333 - CROSS_SIZE, y: 624 - CROSS_SIZE },
            end: { x: 333 + CROSS_SIZE, y: 624 + CROSS_SIZE },
            thickness: 1,
          });

          page.drawLine({
            start: { x: 333 - CROSS_SIZE, y: 624 + CROSS_SIZE },
            end: { x: 333 + CROSS_SIZE, y: 624 - CROSS_SIZE },
            thickness: 1,
          });
        } else {
          if (!classified_ad?.is_co_paper) {
            if (attachments.isCO) {
              page.drawLine({
                start: { x: 333 - CROSS_SIZE_SMALL, y: 624 - CROSS_SIZE_SMALL },
                end: { x: 333 + CROSS_SIZE_SMALL, y: 624 + CROSS_SIZE_SMALL },
                thickness: 1,
                color: rgb(0, 0.5, 0.9),
              });

              page.drawLine({
                start: { x: 333 - CROSS_SIZE_SMALL, y: 624 + CROSS_SIZE_SMALL },
                end: { x: 333 + CROSS_SIZE_SMALL, y: 624 - CROSS_SIZE_SMALL },
                thickness: 1,
                color: rgb(0, 0.5, 0.9),
              });
            }
          }
        }

        if (
          classified_ad?.is_int_bw ||
          classified_ad?.is_int_fc ||
          classified_ad?.is_int_highlight
        ) {
          page.drawLine({
            start: { x: 432 - CROSS_SIZE, y: 622 - CROSS_SIZE },
            end: { x: 432 + CROSS_SIZE, y: 622 + CROSS_SIZE },
            thickness: 1,
          });

          page.drawLine({
            start: { x: 432 - CROSS_SIZE, y: 622 + CROSS_SIZE },
            end: { x: 432 + CROSS_SIZE, y: 622 - CROSS_SIZE },
            thickness: 1,
          });
        }
        // word_count
        page.drawText(String(effective_word_count) ?? "", {
          x: 240,
          y: 532,
          size: 10,
          font: SINHALA_REGEX.test(String(effective_word_count) ?? "")
            ? sinhalaFont
            : englishFont,
        });

        // Draw advertiser details
        const formattedName = formatAdvertiserName(advertiser_name);
        await drawTextOrSinhalaImage(
          page,
          pdfDoc,
          String(formattedName),
          128,
          145,
          englishFont,
          sinhalaFont,
          11,
        );

        await drawTextOrSinhalaImage(
          page,
          pdfDoc,
          String(advertiser_address ?? ""),
          89,
          115,
          englishFont,
          sinhalaFont,
          11,
        );

        const PHONE_X = [95, 113, 129, 146, 163, 180, 196, 213, 230, 247];
        const PHONE_Y = 35;

        // Normalize phone: 94xxxxxxxxx → 0xxxxxxxxx
        let phoneDigits = String(advertiser_phone ?? "").replace(/\D/g, "");

        if (phoneDigits.startsWith("94") && phoneDigits.length >= 11) {
          phoneDigits = "0" + phoneDigits.slice(-9);
        }

        // Safety: ensure max 10 digits
        phoneDigits = phoneDigits.slice(0, 10);

        for (let i = 0; i < phoneDigits.length; i++) {
          page.drawText(phoneDigits[i], {
            x: PHONE_X[i],
            y: PHONE_Y,
            size: 9,
            font: SINHALA_REGEX.test(phoneDigits[i])
              ? sinhalaFont
              : englishFont,
          });
        }

        const NIC_X = [
          95, 113, 129, 146, 163, 180, 196, 213, 230, 247, 263, 279,
        ];
        const NIC_Y = 72;

        const nic = String(advertiser_nic ?? "")
          .toUpperCase()
          .slice(0, NIC_X.length);

        for (let i = 0; i < nic.length; i++) {
          page.drawText(nic[i], {
            x: NIC_X[i],
            y: NIC_Y,
            size: 9,
            font: SINHALA_REGEX.test(nic[i]) ? sinhalaFont : englishFont,
          });
        }

        const signature = getSignature(advertiser_name);

        await drawTextOrSinhalaImage(
          page,
          pdfDoc,
          String(signature),
          439,
          73,
          englishFont,
          sinhalaFont,
          9,
        );

        page.drawText(todayDate, {
          x: 434,
          y: 31,
          size: 9,
          font: englishFont, // date is always English digits
        });

        // if (ad_type !== "casual") {
        await drawAdTextBlock(
          page,
          pdfDoc,
          finalAdvertisementText,
          45, // x position
          435, // starting Y
          17, // line gap (adjust this to increase/decrease vertical spacing)
          375, // column width in points (adjust to fit your PDF layout)
          sinhalaFont,
          englishFont,
          10.5, // font size
          15, // max lines
        );
        // }
      } else {
        //admin notes - associated papers - except marriage, name notice, casual, photo_classified and death notice
        page.drawText(String(attachments.classfication ?? ""), {
          x: 197,
          y: 353,
          size: 10,
          font: SINHALA_REGEX.test(String(attachments.classfication ?? ""))
            ? sinhalaFont
            : englishFont,
          color: rgb(0, 0.5, 0.9),
        });

        page.drawText(String(attachments.noInsertions ?? ""), {
          x: 426,
          y: 450,
          size: 10,
          font: SINHALA_REGEX.test(String(attachments.noInsertions ?? ""))
            ? sinhalaFont
            : englishFont,
          color: rgb(0, 0.5, 0.9),
        });

        page.drawText(String(attachments.adminNotes ?? ""), {
          x: 31,
          y: 119,
          size: 10,
          font: SINHALA_REGEX.test(String(attachments.adminNotes ?? ""))
            ? sinhalaFont
            : englishFont,
          color: rgb(0, 0.5, 0.9),
        });

        page.drawText(String(reference_number) ?? "", {
          x: 487,
          y: 593,
          size: 9,
          font: SINHALA_REGEX.test(String(reference_number) ?? "")
            ? sinhalaFont
            : englishFont,
        });

        // Drawing Advertiser Details
        await drawTextOrSinhalaImage(
          page,
          pdfDoc,
          String(advertiser_name),
          97.75,
          709,
          englishFont,
          sinhalaFont,
          9,
        );

        await drawTextOrSinhalaImage(
          page,
          pdfDoc,
          String(advertiser_address),
          53,
          663,
          englishFont,
          sinhalaFont,
          9,
        );

        // draw advertiser signature
        page.drawText(String(getSignature(advertiser_name)), {
          x: 375,
          y: 45,
          size: 9,
          font: SINHALA_REGEX.test(String(getSignature(advertiser_name)))
            ? sinhalaFont
            : englishFont,
        });

        // advertiser tel number
        const PHONE_X = [77, 94, 112, 131, 150, 170, 188, 207, 225, 242];
        const PHONE_Y = 555;

        // Normalize phone: 94xxxxxxxxx → 0xxxxxxxxx
        let phoneDigits = String(advertiser_phone ?? "").replace(/\D/g, "");

        if (phoneDigits.startsWith("94") && phoneDigits.length >= 11) {
          phoneDigits = "0" + phoneDigits.slice(-9);
        }

        // Safety: ensure max 10 digits
        phoneDigits = phoneDigits.slice(0, 10);

        for (let i = 0; i < phoneDigits.length; i++) {
          page.drawText(phoneDigits[i], {
            x: PHONE_X[i],
            y: PHONE_Y,
            size: 10,
            font: SINHALA_REGEX.test(phoneDigits[i])
              ? sinhalaFont
              : englishFont,
          });
        }

        // advertiser nic
        const NIC_X = [
          75, 92, 110, 129, 148, 168, 186, 205, 223, 240, 255, 265,
        ];
        const NIC_Y = 587;

        const nic = String(advertiser_nic ?? "")
          .toUpperCase()
          .slice(0, NIC_X.length);

        for (let i = 0; i < nic.length; i++) {
          page.drawText(nic[i], {
            x: NIC_X[i],
            y: NIC_Y,
            size: 10,
            font: SINHALA_REGEX.test(nic[i]) ? sinhalaFont : englishFont,
          });
        }

        if (newspaper_id === "SILUMINA") {
          // SILUMINA cross
          page.drawLine({
            start: { x: 25.15 - CROSS_SIZE_SMALL, y: 498 - CROSS_SIZE_SMALL },
            end: { x: 25.15 + CROSS_SIZE_SMALL, y: 498 + CROSS_SIZE_SMALL },
            thickness: 1,
          });

          page.drawLine({
            start: { x: 25.15 - CROSS_SIZE_SMALL, y: 498 + CROSS_SIZE_SMALL },
            end: { x: 25.15 + CROSS_SIZE_SMALL, y: 498 - CROSS_SIZE_SMALL },
            thickness: 1,
          });

          if (classified_ad?.is_publish_eng) {
            // S/observer cross
            page.drawLine({
              start: {
                x: 25.15 - CROSS_SIZE_SMALL,
                y: 446.12 - CROSS_SIZE_SMALL,
              },
              end: {
                x: 25.15 + CROSS_SIZE_SMALL,
                y: 446.12 + CROSS_SIZE_SMALL,
              },
              thickness: 1,
            });

            page.drawLine({
              start: {
                x: 25.15 - CROSS_SIZE_SMALL,
                y: 446.12 + CROSS_SIZE_SMALL,
              },
              end: {
                x: 25.15 + CROSS_SIZE_SMALL,
                y: 446.12 - CROSS_SIZE_SMALL,
              },
              thickness: 1,
            });
          }

          if (classified_ad?.is_publish_tam) {
            // varamanjari cross
            page.drawLine({
              start: {
                x: 25.15 - CROSS_SIZE_SMALL,
                y: 394.4 - CROSS_SIZE_SMALL,
              },
              end: { x: 25.15 + CROSS_SIZE_SMALL, y: 394.4 + CROSS_SIZE_SMALL },
              thickness: 1,
            });

            page.drawLine({
              start: {
                x: 25.15 - CROSS_SIZE_SMALL,
                y: 394.4 + CROSS_SIZE_SMALL,
              },
              end: { x: 25.15 + CROSS_SIZE_SMALL, y: 394.4 - CROSS_SIZE_SMALL },
              thickness: 1,
            });
          }

          if (classified_ad?.is_publish_eng_tam) {
            // S/observer cross
            page.drawLine({
              start: {
                x: 25.15 - CROSS_SIZE_SMALL,
                y: 446.12 - CROSS_SIZE_SMALL,
              },
              end: {
                x: 25.15 + CROSS_SIZE_SMALL,
                y: 446.12 + CROSS_SIZE_SMALL,
              },
              thickness: 1,
            });

            page.drawLine({
              start: {
                x: 25.15 - CROSS_SIZE_SMALL,
                y: 446.12 + CROSS_SIZE_SMALL,
              },
              end: {
                x: 25.15 + CROSS_SIZE_SMALL,
                y: 446.12 - CROSS_SIZE_SMALL,
              },
              thickness: 1,
            });

            // varamanjari cross
            page.drawLine({
              start: {
                x: 25.15 - CROSS_SIZE_SMALL,
                y: 394.4 - CROSS_SIZE_SMALL,
              },
              end: { x: 25.15 + CROSS_SIZE_SMALL, y: 394.4 + CROSS_SIZE_SMALL },
              thickness: 1,
            });

            page.drawLine({
              start: {
                x: 25.15 - CROSS_SIZE_SMALL,
                y: 394.4 + CROSS_SIZE_SMALL,
              },
              end: { x: 25.15 + CROSS_SIZE_SMALL, y: 394.4 - CROSS_SIZE_SMALL },
              thickness: 1,
            });
          }
        } else if (newspaper_id === "SUNDAY_OBSERVER") {
          // S/observer cross
          page.drawLine({
            start: {
              x: 25.15 - CROSS_SIZE_SMALL,
              y: 446.12 - CROSS_SIZE_SMALL,
            },
            end: {
              x: 25.15 + CROSS_SIZE_SMALL,
              y: 446.12 + CROSS_SIZE_SMALL,
            },
            thickness: 1,
          });

          page.drawLine({
            start: {
              x: 25.15 - CROSS_SIZE_SMALL,
              y: 446.12 + CROSS_SIZE_SMALL,
            },
            end: {
              x: 25.15 + CROSS_SIZE_SMALL,
              y: 446.12 - CROSS_SIZE_SMALL,
            },
            thickness: 1,
          });

          if (classified_ad?.is_publish_sin) {
            // SILUMINA cross
            page.drawLine({
              start: { x: 25.15 - CROSS_SIZE_SMALL, y: 498 - CROSS_SIZE_SMALL },
              end: { x: 25.15 + CROSS_SIZE_SMALL, y: 498 + CROSS_SIZE_SMALL },
              thickness: 1,
            });

            page.drawLine({
              start: { x: 25.15 - CROSS_SIZE_SMALL, y: 498 + CROSS_SIZE_SMALL },
              end: { x: 25.15 + CROSS_SIZE_SMALL, y: 498 - CROSS_SIZE_SMALL },
              thickness: 1,
            });
          }

          if (classified_ad?.is_publish_tam) {
            // varamanjari cross
            page.drawLine({
              start: {
                x: 25.15 - CROSS_SIZE_SMALL,
                y: 394.4 - CROSS_SIZE_SMALL,
              },
              end: { x: 25.15 + CROSS_SIZE_SMALL, y: 394.4 + CROSS_SIZE_SMALL },
              thickness: 1,
            });

            page.drawLine({
              start: {
                x: 25.15 - CROSS_SIZE_SMALL,
                y: 394.4 + CROSS_SIZE_SMALL,
              },
              end: { x: 25.15 + CROSS_SIZE_SMALL, y: 394.4 - CROSS_SIZE_SMALL },
              thickness: 1,
            });
          }

          if (classified_ad?.is_publish_sin_tam) {
            // SILUMINA cross
            page.drawLine({
              start: { x: 25.15 - CROSS_SIZE_SMALL, y: 498 - CROSS_SIZE_SMALL },
              end: { x: 25.15 + CROSS_SIZE_SMALL, y: 498 + CROSS_SIZE_SMALL },
              thickness: 1,
            });

            page.drawLine({
              start: { x: 25.15 - CROSS_SIZE_SMALL, y: 498 + CROSS_SIZE_SMALL },
              end: { x: 25.15 + CROSS_SIZE_SMALL, y: 498 - CROSS_SIZE_SMALL },
              thickness: 1,
            });

            // varamanjari cross
            page.drawLine({
              start: {
                x: 25.15 - CROSS_SIZE_SMALL,
                y: 394.4 - CROSS_SIZE_SMALL,
              },
              end: { x: 25.15 + CROSS_SIZE_SMALL, y: 394.4 + CROSS_SIZE_SMALL },
              thickness: 1,
            });

            page.drawLine({
              start: {
                x: 25.15 - CROSS_SIZE_SMALL,
                y: 394.4 + CROSS_SIZE_SMALL,
              },
              end: { x: 25.15 + CROSS_SIZE_SMALL, y: 394.4 - CROSS_SIZE_SMALL },
              thickness: 1,
            });
          }
        } else if (newspaper_id === "DAILY_DINAMINA") {
          page.drawLine({
            start: {
              x: 25 - CROSS_SIZE_SMALL,
              y: 473 - CROSS_SIZE_SMALL,
            },
            end: {
              x: 25 + CROSS_SIZE_SMALL,
              y: 473 + CROSS_SIZE_SMALL,
            },
            thickness: 1,
          });

          page.drawLine({
            start: {
              x: 25 - CROSS_SIZE_SMALL,
              y: 473 + CROSS_SIZE_SMALL,
            },
            end: {
              x: 25 + CROSS_SIZE_SMALL,
              y: 473 - CROSS_SIZE_SMALL,
            },
            thickness: 1,
          });
        } else if (newspaper_id === "DAILY_NEWS") {
          page.drawLine({
            start: {
              x: 25.15 - CROSS_SIZE_SMALL,
              y: 420 - CROSS_SIZE_SMALL,
            },
            end: {
              x: 25.15 + CROSS_SIZE_SMALL,
              y: 420 + CROSS_SIZE_SMALL,
            },
            thickness: 1,
          });

          page.drawLine({
            start: {
              x: 25.15 - CROSS_SIZE_SMALL,
              y: 420 + CROSS_SIZE_SMALL,
            },
            end: {
              x: 25.15 + CROSS_SIZE_SMALL,
              y: 420 - CROSS_SIZE_SMALL,
            },
            thickness: 1,
          });
        }

        // publishing date and month
        const dateStr = String(publish_date ?? "");

        let day = "";
        let month = "";

        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          const [, mm, dd] = dateStr.split("-");
          month = mm;
          day = dd;
        }

        // DATE → dd
        page.drawText(day, {
          x: 137.48,
          y: 450,
          size: 9,
          font: SINHALA_REGEX.test(day) ? sinhalaFont : englishFont,
        });

        // MONTH → mm
        page.drawText(month, {
          x: 180,
          y: 450,
          size: 9,
          font: SINHALA_REGEX.test(month) ? sinhalaFont : englishFont,
        });

        page.drawText(String(effective_word_count ?? ""), {
          x: 360,
          y: 450,
          size: 10,
          font: SINHALA_REGEX.test(String(effective_word_count ?? ""))
            ? sinhalaFont
            : englishFont,
        });

        page.drawText(String(classified_ad?.district ?? ""), {
          x: 360,
          y: 385,
          size: 10,
          font: SINHALA_REGEX.test(String(classified_ad?.district ?? ""))
            ? sinhalaFont
            : englishFont,
        });

        // draw co paper
        if (classified_ad?.is_co_paper) {
          page.drawLine({
            start: {
              x: 350 - CROSS_SIZE_SMALL,
              y: 425 - CROSS_SIZE_SMALL,
            },
            end: {
              x: 350 + CROSS_SIZE_SMALL,
              y: 425 + CROSS_SIZE_SMALL,
            },
            thickness: 1,
          });

          page.drawLine({
            start: {
              x: 350 - CROSS_SIZE_SMALL,
              y: 425 + CROSS_SIZE_SMALL,
            },
            end: {
              x: 350 + CROSS_SIZE_SMALL,
              y: 425 - CROSS_SIZE_SMALL,
            },
            thickness: 1,
          });
        }
        if (
          classified_ad?.is_int_bw ||
          classified_ad?.is_int_fc ||
          classified_ad?.is_int_highlight
        ) {
          page.drawLine({
            start: {
              x: 490 - CROSS_SIZE_SMALL,
              y: 425 - CROSS_SIZE_SMALL,
            },
            end: {
              x: 490 + CROSS_SIZE_SMALL,
              y: 425 + CROSS_SIZE_SMALL,
            },
            thickness: 1,
          });

          page.drawLine({
            start: {
              x: 490 - CROSS_SIZE_SMALL,
              y: 425 + CROSS_SIZE_SMALL,
            },
            end: {
              x: 490 + CROSS_SIZE_SMALL,
              y: 425 - CROSS_SIZE_SMALL,
            },
            thickness: 1,
          });
        }

        page.drawText(String(subcategory ?? ""), {
          x: 260,
          y: 352,
          size: 10,
          font: SINHALA_REGEX.test(String(subcategory ?? ""))
            ? sinhalaFont
            : englishFont,
        });

        if (ad_type !== "casual") {
          // Normalize ad text
          const normalizedText = normalizeAdText(
            finalAdvertisementText,
            agency.ad_text_type,
          );
          const { COLUMN_X, ROW_Y } = getCoordinates(agency.publisher_name);
          const wordsToPrint = Math.min(
            normalizedText.length,
            MAX_WORDS,
            COLUMN_X.length * ROW_Y.length,
          );

          // Draw ad text
          for (let i = 0; i < wordsToPrint; i++) {
            const col = i % COLUMN_X.length;
            const row = Math.floor(i / COLUMN_X.length);
            if (row >= ROW_Y.length) break;

            const text = normalizedText[i];

            if (SINHALA_REGEX.test(text)) {
              const pngBuffer = renderSinhalaTextToImage(text, 18);
              const pngImage = await pdfDoc.embedPng(pngBuffer);
              const dims = pngImage.scale(0.5); // adjust scale to fit

              page.drawImage(pngImage, {
                x: COLUMN_X[col],
                y: ROW_Y[row] - dims.height, // shift down by image height
                width: dims.width,
                height: dims.height,
              });
            } else {
              page.drawText(text, {
                x: COLUMN_X[col],
                y: ROW_Y[row],
                size: 9,
                font: englishFont,
              });
            }
          }
        }

        // const category_X = [511, 540, 570];
        // const category_Y = 394;

        // const cat = String(subcategory ?? "");

        // for (let i = 0; i < cat.length; i++) {
        //   page.drawText(cat[i], {
        //     x: category_X[i],
        //     y: category_Y,
        //     size: 11,
        //     font: SINHALA_REGEX.test(cat[i]) ? sinhalaFont : englishFont,
        //   });
        // }
      }

      //Draw sizes for casual and marriage

      //casual
      if (ad_type === "casual") {
        if (casual_ad?.ad_size === "custom") {
          page.drawText(String(casual_ad?.ad_height ?? ""), {
            x: 232,
            y: 532,
            size: 10,
            font: SINHALA_REGEX.test(String(casual_ad?.ad_height))
              ? sinhalaFont
              : englishFont,
          });

          page.drawText(" x ", {
            x: 240,
            y: 532,
            size: 10,
            font: SINHALA_REGEX.test(" x ") ? sinhalaFont : englishFont,
          });

          page.drawText(String(casual_ad?.no_of_columns ?? ""), {
            x: 250,
            y: 532,
            size: 10,
            font: SINHALA_REGEX.test(String(casual_ad?.no_of_columns))
              ? sinhalaFont
              : englishFont,
          });
        } else {
          page.drawText(String(casual_ad?.ad_size ?? ""), {
            x: 232,
            y: 532,
            size: 10,
            font: SINHALA_REGEX.test(String(casual_ad?.ad_size))
              ? sinhalaFont
              : englishFont,
          });
        }
      } else if (ad_type === "marriage") {
        page.drawText("2col x 6 cm", {
          x: 232,
          y: 512,
          size: 10,
          font: SINHALA_REGEX.test("2col x 6 cm") ? sinhalaFont : englishFont,
        });
      }
    }
    if (publisherName === "liberty_publishers") {
      if (attachments.isCarsOthers !== null) {
        if (attachments.isCarsOthers === "c") {
          page.drawLine({
            start: {
              x: 378 - CROSS_SIZE_SMALL_XS,
              y: 564 - CROSS_SIZE_SMALL_XS,
            },
            end: { x: 378 + CROSS_SIZE_SMALL_XS, y: 564 + CROSS_SIZE_SMALL_XS },
            thickness: 1,
            color: rgb(0, 0.5, 0.9),
          });

          page.drawLine({
            start: {
              x: 378 - CROSS_SIZE_SMALL_XS,
              y: 564 + CROSS_SIZE_SMALL_XS,
            },
            end: { x: 378 + CROSS_SIZE_SMALL_XS, y: 564 - CROSS_SIZE_SMALL_XS },
            thickness: 1,
            color: rgb(0, 0.5, 0.9),
          });
        }
        if (attachments.isCarsOthers === "o") {
          page.drawLine({
            start: {
              x: 437 - CROSS_SIZE_SMALL_XS,
              y: 564 - CROSS_SIZE_SMALL_XS,
            },
            end: { x: 437 + CROSS_SIZE_SMALL_XS, y: 564 + CROSS_SIZE_SMALL_XS },
            thickness: 1,
            color: rgb(0, 0.5, 0.9),
          });

          page.drawLine({
            start: {
              x: 437 - CROSS_SIZE_SMALL_XS,
              y: 564 + CROSS_SIZE_SMALL_XS,
            },
            end: { x: 437 + CROSS_SIZE_SMALL_XS, y: 564 - CROSS_SIZE_SMALL_XS },
            thickness: 1,
            color: rgb(0, 0.5, 0.9),
          });
        }
      }
      if (attachments.hasPhoto) {
        page.drawLine({
          start: { x: 421 - CROSS_SIZE_SMALL_XS, y: 546 - CROSS_SIZE_SMALL_XS },
          end: { x: 421 + CROSS_SIZE_SMALL_XS, y: 546 + CROSS_SIZE_SMALL_XS },
          thickness: 1,
          color: rgb(0, 0.5, 0.9),
        });

        page.drawLine({
          start: { x: 421 - CROSS_SIZE_SMALL_XS, y: 546 + CROSS_SIZE_SMALL_XS },
          end: { x: 421 + CROSS_SIZE_SMALL_XS, y: 546 - CROSS_SIZE_SMALL_XS },
          thickness: 1,
          color: rgb(0, 0.5, 0.9),
        });
      }
      page.drawText(String(attachments.specialPosition ?? ""), {
        x: 465,
        y: 630,
        size: 9,
        font: SINHALA_REGEX.test(String(attachments.specialPosition))
          ? sinhalaFont
          : englishFont,
        color: rgb(0, 0.5, 0.9),
      });
      page.drawText(String(attachments.color ?? ""), {
        x: 528,
        y: 563,
        size: 9,
        font: SINHALA_REGEX.test(String(attachments.color))
          ? sinhalaFont
          : englishFont,
        color: rgb(0, 0.5, 0.9),
      });
      page.drawText(String(attachments.adminNotes ?? ""), {
        x: 31,
        y: 244,
        size: 9,
        font: SINHALA_REGEX.test(String(attachments.adminNotes))
          ? sinhalaFont
          : englishFont,
        color: rgb(0, 0.5, 0.9),
      });

      //receipt
      page.drawText(String(reference_number ?? ""), {
        x: 52,
        y: 543,
        size: 9,
        font: SINHALA_REGEX.test(String(reference_number))
          ? sinhalaFont
          : englishFont,
      });

      page.drawText(String(effective_word_count ?? ""), {
        x: 340,
        y: 710,
        size: 9,
        font: SINHALA_REGEX.test(String(effective_word_count))
          ? sinhalaFont
          : englishFont,
      });

      //category
      page.drawText(String(subcategory ?? ""), {
        x: 340,
        y: 663,
        size: 9,
        font: SINHALA_REGEX.test(String(subcategory))
          ? sinhalaFont
          : englishFont,
      });

      page.drawText(String(classified_ad?.vehicle_brand ?? ""), {
        x: 343,
        y: 580,
        size: 10,
        font: SINHALA_REGEX.test(String(classified_ad?.vehicle_brand ?? ""))
          ? sinhalaFont
          : englishFont,
      });

      //h x w
      page.drawText(String(casual_ad?.ad_height ?? ""), {
        x: 465,
        y: 669,
        size: 10,
        font: SINHALA_REGEX.test(String(casual_ad?.ad_height))
          ? sinhalaFont
          : englishFont,
      });

      // page.drawText(" x ", {
      //   x: 270,
      //   y: 534,
      //   size: 10,
      //   font: SINHALA_REGEX.test(" x ") ? sinhalaFont : englishFont,
      // });

      page.drawText(String(casual_ad?.no_of_columns ?? ""), {
        x: 530,
        y: 669,
        size: 10,
        font: SINHALA_REGEX.test(String(casual_ad?.no_of_columns))
          ? sinhalaFont
          : englishFont,
      });

      if (casual_ad?.color_option === "fc") {
        color_x = 498;
        color_y = 533;
      } else if (casual_ad?.color_option === "bw1") {
        color_x = 498;
        color_y = 564;
      } else if (casual_ad?.color_option === "bw2") {
        color_x = 498;
        color_y = 549;
      } else if (casual_ad?.color_option === "bw") {
        color_x = 498;
        color_y = 582;
      }

      page.drawLine({
        start: {
          x: color_x - CROSS_SIZE_SMALL_XS,
          y: color_y - CROSS_SIZE_SMALL_XS,
        },
        end: {
          x: color_x + CROSS_SIZE_SMALL_XS,
          y: color_y + CROSS_SIZE_SMALL_XS,
        },
        thickness: 1,
      });

      page.drawLine({
        start: {
          x: color_x - CROSS_SIZE_SMALL_XS,
          y: color_y + CROSS_SIZE_SMALL_XS,
        },
        end: {
          x: color_x + CROSS_SIZE_SMALL_XS,
          y: color_y - CROSS_SIZE_SMALL_XS,
        },
        thickness: 1,
      });

      if (ad_type.key !== "casual") {
        // Normalize ad text
        const normalizedText = normalizeAdText(
          finalAdvertisementText,
          agency.ad_text_type,
        );
        const { COLUMN_X, ROW_Y } = getCoordinates(agency.publisher_name);
        const wordsToPrint = Math.min(
          normalizedText.length,
          MAX_WORDS,
          COLUMN_X.length * ROW_Y.length,
        );

        // Draw ad text
        for (let i = 0; i < wordsToPrint; i++) {
          const col = i % COLUMN_X.length;
          const row = Math.floor(i / COLUMN_X.length);
          if (row >= ROW_Y.length) break;

          const text = normalizedText[i];

          if (SINHALA_REGEX.test(text)) {
            const pngBuffer = renderSinhalaTextToImage(text, 18);
            const pngImage = await pdfDoc.embedPng(pngBuffer);
            const dims = pngImage.scale(0.5); // adjust scale to fit

            page.drawImage(pngImage, {
              x: COLUMN_X[col],
              y: ROW_Y[row] - dims.height, // shift down by image height
              width: dims.width,
              height: dims.height,
            });
          } else {
            page.drawText(text, {
              x: COLUMN_X[col],
              y: ROW_Y[row],
              size: 9,
              font: englishFont,
            });
          }
        }
      }

      //advertiser details
      const formattedName = formatAdvertiserName(advertiser_name);
      await drawSmartText({
        page,
        pdfDoc,
        text: formattedName,
        x: 43,
        y: 92,
        fontSize: 9,
        englishFont,
      });

      await drawSmartText({
        page,
        pdfDoc,
        text: advertiser_address ?? "",
        x: 55,
        y: 69,
        fontSize: 10,
        englishFont,
      });

      page.drawText(String(advertiser_phone ?? ""), {
        x: 240,
        y: 45,
        size: 9,
        font: SINHALA_REGEX.test(String(advertiser_phone))
          ? sinhalaFont
          : englishFont,
      });

      page.drawText(String(advertiser_nic ?? ""), {
        x: 77,
        y: 45,
        size: 9,
        font: SINHALA_REGEX.test(String(advertiser_nic))
          ? sinhalaFont
          : englishFont,
      });

      await drawSmartText({
        page,
        pdfDoc,
        text: getSignature(advertiser_name),
        x: 225,
        y: 20,
        fontSize: 9,
        englishFont,
      });

      // is photo classified?
      if (ad_type === "photo_classified") {
        page.drawLine({
          start: { x: 405 - CROSS_SIZE_SMALL, y: 537 - CROSS_SIZE_SMALL },
          end: { x: 405 + CROSS_SIZE_SMALL, y: 537 + CROSS_SIZE_SMALL },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 405 - CROSS_SIZE_SMALL, y: 537 + CROSS_SIZE_SMALL },
          end: { x: 405 + CROSS_SIZE_SMALL, y: 537 - CROSS_SIZE_SMALL },
          thickness: 1,
        });
      }

      if (newspaper_id === "SUNDAY_ARUNA") {
        page.drawText(String(publish_date ?? ""), {
          x: 100,
          y: 715,
          size: 10,
          font: SINHALA_REGEX.test(publish_date) ? sinhalaFont : englishFont,
        });

        // draw background tint
        page.drawLine({
          start: { x: 291 - CROSS_SIZE_SMALL, y: 719 - CROSS_SIZE_SMALL },
          end: { x: 291 + CROSS_SIZE_SMALL, y: 719 + CROSS_SIZE_SMALL },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 291 - CROSS_SIZE_SMALL, y: 719 + CROSS_SIZE_SMALL },
          end: { x: 291 + CROSS_SIZE_SMALL, y: 719 - CROSS_SIZE_SMALL },
          thickness: 1,
        });
      }
    }
    if (publisherName === "ceylon_newspapers") {
      if (newspaper_id === "MAWBIMA") {
        page.drawLine({
          start: { x: 555 - CROSS_SIZE_SMALL, y: 777 - CROSS_SIZE_SMALL },
          end: { x: 555 + CROSS_SIZE_SMALL, y: 777 + CROSS_SIZE_SMALL },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 555 - CROSS_SIZE_SMALL, y: 777 + CROSS_SIZE_SMALL },
          end: { x: 555 + CROSS_SIZE_SMALL, y: 777 - CROSS_SIZE_SMALL },
          thickness: 1,
        });
      } else if (newspaper_id === "DAILY_MAWBIMA") {
        page.drawLine({
          start: { x: 494 - CROSS_SIZE_SMALL, y: 777 - CROSS_SIZE_SMALL },
          end: { x: 494 + CROSS_SIZE_SMALL, y: 777 + CROSS_SIZE_SMALL },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 494 - CROSS_SIZE_SMALL, y: 777 + CROSS_SIZE_SMALL },
          end: { x: 494 + CROSS_SIZE_SMALL, y: 777 - CROSS_SIZE_SMALL },
          thickness: 1,
        });
      }

      //extra data print
      page.drawText(String(attachments.noInsertions ?? ""), {
        x: 486,
        y: 690,
        size: 10,
        font: SINHALA_REGEX.test(String(attachments.noInsertions))
          ? sinhalaFont
          : englishFont,
        color: rgb(0, 0.5, 0.9),
      });
      page.drawText(String(attachments.adminNotes ?? ""), {
        x: 36,
        y: 294,
        size: 10,
        font: SINHALA_REGEX.test(String(attachments.adminNotes))
          ? sinhalaFont
          : englishFont,
        color: rgb(0, 0.5, 0.9),
      });

      //word count
      page.drawText(String(effective_word_count ?? ""), {
        x: 122,
        y: 672,
        size: 10,
        font: SINHALA_REGEX.test(String(effective_word_count))
          ? sinhalaFont
          : englishFont,
      });

      //category
      page.drawText(String(subcategory ?? ""), {
        x: 122,
        y: 695,
        size: 10,
        font: SINHALA_REGEX.test(String(subcategory))
          ? sinhalaFont
          : englishFont,
      });
      //receipt
      page.drawText(String(reference_number ?? ""), {
        x: 87,
        y: 647,
        size: 9,
        font: SINHALA_REGEX.test(String(reference_number))
          ? sinhalaFont
          : englishFont,
      });

      if (ad_type === "photo_classified") {
        page.drawLine({
          start: { x: 282 - CROSS_SIZE_SMALL, y: 675 - CROSS_SIZE_SMALL },
          end: { x: 282 + CROSS_SIZE_SMALL, y: 675 + CROSS_SIZE_SMALL },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 282 - CROSS_SIZE_SMALL, y: 675 + CROSS_SIZE_SMALL },
          end: { x: 282 + CROSS_SIZE_SMALL, y: 675 - CROSS_SIZE_SMALL },
          thickness: 1,
        });
      } else if (ad_type === "classified") {
        page.drawLine({
          start: { x: 282 - CROSS_SIZE_SMALL, y: 652 - CROSS_SIZE_SMALL },
          end: { x: 282 + CROSS_SIZE_SMALL, y: 652 + CROSS_SIZE_SMALL },
          thickness: 1,
        });

        page.drawLine({
          start: { x: 282 - CROSS_SIZE_SMALL, y: 652 + CROSS_SIZE_SMALL },
          end: { x: 282 + CROSS_SIZE_SMALL, y: 652 - CROSS_SIZE_SMALL },
          thickness: 1,
        });
      }

      page.drawText(String(publish_date ?? ""), {
        x: 350,
        y: 690,
        size: 10,
        font: SINHALA_REGEX.test(String(publish_date))
          ? sinhalaFont
          : englishFont,
      });

      if (casual_ad?.no_of_boxes === "0" && casual_ad?.ad_size === "custom") {
        //h x w
        const height_form = casual_ad?.ad_height + " cm";
        const width_form = casual_ad?.no_of_columns + " col";
        page.drawText(String(height_form ?? ""), {
          x: 465,
          y: 675,
          size: 10,
          font: SINHALA_REGEX.test(String(height_form))
            ? sinhalaFont
            : englishFont,
        });

        page.drawText(" x ", {
          x: 495,
          y: 675,
          size: 10,
          font: SINHALA_REGEX.test(" x ") ? sinhalaFont : englishFont,
        });

        page.drawText(String(width_form ?? ""), {
          x: 520,
          y: 675,
          size: 10,
          font: SINHALA_REGEX.test(String(width_form))
            ? sinhalaFont
            : englishFont,
        });
      } else if (casual_ad?.no_of_boxes !== "0") {
        page.drawText("box ad: ", {
          x: 480,
          y: 669,
          size: 10,
          font: SINHALA_REGEX.test(" x ") ? sinhalaFont : englishFont,
        });
        const box_form = casual_ad?.no_of_boxes + " boxes";
        page.drawText(String(box_form ?? ""), {
          x: 520,
          y: 669,
          size: 10,
          font: SINHALA_REGEX.test(String(box_form))
            ? sinhalaFont
            : englishFont,
        });
      } else {
        page.drawText(String(casual_ad?.ad_size ?? ""), {
          x: 465,
          y: 669,
          size: 10,
          font: SINHALA_REGEX.test(String(casual_ad?.ad_size))
            ? sinhalaFont
            : englishFont,
        });
      }

      // draw cross color option
      if (casual_ad?.color_option === "fc") {
        color_x = 547;
        color_y = 629;
      } else if (casual_ad?.color_option === "bw1") {
        color_x = 547;
        color_y = 657;
      } else if (casual_ad?.color_option === "bw2") {
        color_x = 409;
        color_y = 629;
      } else if (casual_ad?.color_option === "bw") {
        color_x = 409;
        color_y = 657;
      }

      page.drawLine({
        start: {
          x: color_x - CROSS_SIZE_SMALL,
          y: color_y - CROSS_SIZE_SMALL,
        },
        end: {
          x: color_x + CROSS_SIZE_SMALL,
          y: color_y + CROSS_SIZE_SMALL,
        },
        thickness: 1,
      });

      page.drawLine({
        start: {
          x: color_x - CROSS_SIZE_SMALL,
          y: color_y + CROSS_SIZE_SMALL,
        },
        end: {
          x: color_x + CROSS_SIZE_SMALL,
          y: color_y - CROSS_SIZE_SMALL,
        },
        thickness: 1,
      });
      if (ad_type.key !== "casual") {
        // Normalize ad text
        const normalizedText = normalizeAdText(
          finalAdvertisementText,
          agency.ad_text_type,
        );
        const { COLUMN_X, ROW_Y } = getCoordinates(agency.publisher_name);
        const wordsToPrint = Math.min(
          normalizedText.length,
          MAX_WORDS,
          COLUMN_X.length * ROW_Y.length,
        );

        // Draw ad text
        for (let i = 0; i < wordsToPrint; i++) {
          const col = i % COLUMN_X.length;
          const row = Math.floor(i / COLUMN_X.length);
          if (row >= ROW_Y.length) break;

          const text = normalizedText[i];

          if (SINHALA_REGEX.test(text)) {
            const pngBuffer = renderSinhalaTextToImage(text, 18);
            const pngImage = await pdfDoc.embedPng(pngBuffer);
            const dims = pngImage.scale(0.5); // adjust scale to fit

            page.drawImage(pngImage, {
              x: COLUMN_X[col],
              y: ROW_Y[row] - dims.height + 10, // shift down by image height
              width: dims.width,
              height: dims.height,
            });
          } else {
            page.drawText(text, {
              x: COLUMN_X[col],
              y: ROW_Y[row],
              size: 10,
              font: englishFont,
            });
          }
        }
      }

      //advertiser details
      await drawSmartText({
        page,
        pdfDoc,
        text: formatAdvertiserName(advertiser_name),
        x: 128,
        y: 165,
        fontSize: 10,
        englishFont,
      });

      await drawSmartText({
        page,
        pdfDoc,
        text: advertiser_address ?? "",
        x: 128,
        y: 143,
        fontSize: 10,
        englishFont,
      });

      page.drawText(String(advertiser_phone ?? ""), {
        x: 93,
        y: 105,
        size: 9,
        font: SINHALA_REGEX.test(String(advertiser_phone))
          ? sinhalaFont
          : englishFont,
      });

      page.drawText(String(advertiser_nic ?? ""), {
        x: 305,
        y: 100,
        size: 9,
        font: SINHALA_REGEX.test(String(advertiser_nic))
          ? sinhalaFont
          : englishFont,
      });

      await drawSmartText({
        page,
        pdfDoc,
        text: getSignature(advertiser_name),
        x: 50,
        y: 63,
        fontSize: 9,
        englishFont,
      });

      // Draw date
      const todayDate = getTodayYMD();
      page.drawText(String(todayDate ?? ""), {
        x: 161,
        y: 63,
        size: 10,
        font: SINHALA_REGEX.test(String(todayDate)) ? sinhalaFont : englishFont,
      });
    }
    if (publisherName === "upali_newspapers") {
      if (newspaper_id === "SUNDAY_ISLAND") {
        page.drawText(String(publish_date ?? ""), {
          x: 120,
          y: 650,
          size: 10,
          font: SINHALA_REGEX.test(String(publish_date))
            ? sinhalaFont
            : englishFont,
        });
      }
      if (newspaper_id === "SUNDAY_DIVAINA") {
        page.drawText(String(publish_date ?? ""), {
          x: 120,
          y: 600,
          size: 10,
          font: SINHALA_REGEX.test(String(publish_date))
            ? sinhalaFont
            : englishFont,
        });
      }
      if (
        classified_ad?.is_int_bw ||
        classified_ad?.is_int_fc ||
        classified_ad?.is_int_highlight
      ) {
        page.drawText(String(publish_date ?? ""), {
          x: 120,
          y: 506,
          size: 10,
          font: SINHALA_REGEX.test(String(publish_date))
            ? sinhalaFont
            : englishFont,
        });
      }

      if (ad_type === "casual") {
        page.drawText(String(casual_ad?.ad_height ?? "") + "cm", {
          x: 160,
          y: 454,
          size: 10,
          font: SINHALA_REGEX.test(String(casual_ad?.ad_height) + "cm")
            ? sinhalaFont
            : englishFont,
        });

        page.drawText(" x ", {
          x: 180,
          y: 454,
          size: 10,
          font: SINHALA_REGEX.test(" x ") ? sinhalaFont : englishFont,
        });

        page.drawText(String(casual_ad?.no_of_columns ?? "") + "col", {
          x: 190,
          y: 454,
          size: 10,
          font: SINHALA_REGEX.test(String(casual_ad?.no_of_columns) + "col")
            ? sinhalaFont
            : englishFont,
        });

        const color_opt = formatColorType(casual_ad?.color_option);
        page.drawText(String(color_opt ?? ""), {
          x: 160,
          y: 434,
          size: 9,
          font: SINHALA_REGEX.test(String(color_opt))
            ? sinhalaFont
            : englishFont,
        });
      }

      page.drawText(String(subcategory ?? ""), {
        x: 165,
        y: 470,
        size: 10,
        font: SINHALA_REGEX.test(String(subcategory))
          ? sinhalaFont
          : englishFont,
      });

      page.drawText(String(effective_word_count ?? ""), {
        x: 455,
        y: 470,
        size: 10,
        font: SINHALA_REGEX.test(String(effective_word_count ?? ""))
          ? sinhalaFont
          : englishFont,
      });

      if (ad_type.key !== "casual") {
        await drawAdTextBlock(
          page,
          pdfDoc,
          finalAdvertisementText,
          45, // x position
          384, // starting Y
          17, // line gap (adjust this to increase/decrease vertical spacing)
          375, // column width in points (adjust to fit your PDF layout)
          sinhalaFont,
          englishFont,
          11.5, // font size
          15, // max lines
        );
      }

      //extra data print
      page.drawText(String(attachments.size ?? ""), {
        x: 167,
        y: 458,
        size: 10,
        font: SINHALA_REGEX.test(String(attachments.size))
          ? sinhalaFont
          : englishFont,
        color: rgb(0, 0.5, 0.9),
      });
      page.drawText(String(attachments.color ?? ""), {
        x: 167,
        y: 436,
        size: 10,
        font: SINHALA_REGEX.test(String(attachments.color))
          ? sinhalaFont
          : englishFont,
        color: rgb(0, 0.5, 0.9),
      });
      page.drawText(String(attachments.adminNotes ?? ""), {
        x: 25,
        y: 179,
        size: 10,
        font: SINHALA_REGEX.test(String(attachments.adminNotes))
          ? sinhalaFont
          : englishFont,
        color: rgb(0, 0.5, 0.9),
      });

      // Draw advertiser info
      await drawSmartText({
        page,
        pdfDoc,
        text: formatAdvertiserName(advertiser_name),
        x: 40,
        y: 118,
        fontSize: 10,
        englishFont,
      });

      await drawSmartText({
        page,
        pdfDoc,
        text: advertiser_address ?? "",
        x: 30,
        y: 80,
        fontSize: 10,
        englishFont,
      });

      await drawSmartText({
        page,
        pdfDoc,
        text: advertiser_phone ?? "",
        x: 410,
        y: 100,
        fontSize: 9,
        englishFont,
      });

      await drawSmartText({
        page,
        pdfDoc,
        text: advertiser_nic ?? "",
        x: 425,
        y: 120,
        fontSize: 9,
        englishFont,
      });

      await drawSmartText({
        page,
        pdfDoc,
        text: getSignature(advertiser_name),
        x: 95,
        y: 20,
        fontSize: 9,
        englishFont,
      });

      page.drawText(String(reference_number ?? ""), {
        x: 410,
        y: 75,
        size: 9,
        font: SINHALA_REGEX.test(String(reference_number))
          ? sinhalaFont
          : englishFont,
      });

      const todayDate = getTodayYMD();
      page.drawText(String(todayDate ?? ""), {
        x: 253,
        y: 20,
        size: 10,
        font: SINHALA_REGEX.test(String(todayDate)) ? sinhalaFont : englishFont,
      });
    }
    if (publisherName === "express_newspapers") {
      if (newspaper_id === "SUNDAY_VIRAKESARI") {
        page.drawText(String("Sunday Virakesari"), {
          x: 118,
          y: 654,
          size: 12,
          font: SINHALA_REGEX.test(String("Sunday Virakesari"))
            ? sinhalaFont
            : englishFont,
        });
      }
      if (
        newspaper_id === "VIRAKESARI" ||
        newspaper_id === "DAILY_VIRAKESARI"
      ) {
        page.drawText(String("Daily Virakesari"), {
          x: 118,
          y: 654,
          size: 12,
          font: SINHALA_REGEX.test(String("Daily Virakesari"))
            ? sinhalaFont
            : englishFont,
        });
      }

      page.drawText(String(publish_date ?? ""), {
        x: 113,
        y: 630,
        size: 12,
        font: SINHALA_REGEX.test(String(publish_date))
          ? sinhalaFont
          : englishFont,
      });

      // source - paper agent cross
      page.drawLine({
        start: {
          x: 450 - CROSS_SIZE_SMALL,
          y: 698 - CROSS_SIZE_SMALL,
        },
        end: {
          x: 450 + CROSS_SIZE_SMALL,
          y: 698 + CROSS_SIZE_SMALL,
        },
        thickness: 2,
      });

      page.drawLine({
        start: {
          x: 450 - CROSS_SIZE_SMALL,
          y: 698 + CROSS_SIZE_SMALL,
        },
        end: {
          x: 450 + CROSS_SIZE_SMALL,
          y: 698 - CROSS_SIZE_SMALL,
        },
        thickness: 2,
      });

      if (classified_ad.is_co_paper) {
        page.drawText(String("Yes"), {
          x: 503,
          y: 595,
          size: 10,
          font: SINHALA_REGEX.test(String("Yes")) ? sinhalaFont : englishFont,
        });
      } else {
        page.drawText(String("No"), {
          x: 503,
          y: 595,
          size: 10,
          font: SINHALA_REGEX.test(String("No")) ? sinhalaFont : englishFont,
        });
      }
      // page.drawText(String(effective_word_count ?? ""), {
      //   x: 455,
      //   y: 470,
      //   size: 10,
      //   font: SINHALA_REGEX.test(String(effective_word_count ?? ""))
      //     ? sinhalaFont
      //     : englishFont,
      // });

      // Draw advertiser info
      await drawSmartText({
        page,
        pdfDoc,
        text: formatAdvertiserName(advertiser_name),
        x: 108,
        y: 743,
        fontSize: 12,
        englishFont,
      });

      const address = advertiser_address ?? "";

      if (address.length > 35) {
        await drawSmartText({
          page,
          pdfDoc,
          text: address.slice(0, 35),
          x: 81,
          y: 722,
          fontSize: 12,
          englishFont,
        });

        await drawSmartText({
          page,
          pdfDoc,
          text: address.slice(35),
          x: 81,
          y: 703, // second line coordinate
          fontSize: 12,
          englishFont,
        });
      } else {
        await drawSmartText({
          page,
          pdfDoc,
          text: address,
          x: 81,
          y: 722,
          fontSize: 12,
          englishFont,
        });
      }

      await drawSmartText({
        page,
        pdfDoc,
        text: advertiser_phone ?? "",
        x: 78,
        y: 675,
        fontSize: 12,
        englishFont,
      });

      await drawSmartText({
        page,
        pdfDoc,
        text: advertiser_nic ?? "",
        x: 320,
        y: 24,
        fontSize: 11,
        englishFont,
      });

      await drawSmartText({
        page,
        pdfDoc,
        text: getSignature(advertiser_name),
        x: 456,
        y: 35,
        fontSize: 9.5,
        englishFont,
      });

      page.drawText(String(reference_number ?? ""), {
        x: 454,
        y: 773,
        size: 11,
        font: SINHALA_REGEX.test(String(reference_number))
          ? sinhalaFont
          : englishFont,
      });

      const todayDate = getTodayYMD();
      page.drawText(String(todayDate ?? ""), {
        x: 199,
        y: 25,
        size: 11,
        font: SINHALA_REGEX.test(String(todayDate)) ? sinhalaFont : englishFont,
      });

      // await drawAdTextBlock(
      //   page,
      //   pdfDoc,
      //   finalAdvertisementText,
      //   32, // x position
      //   558, // starting Y
      //   22, // line gap (adjust this to increase/decrease vertical spacing)
      //   520, // column width in points (adjust to fit your PDF layout)
      //   sinhalaFont,
      //   englishFont,
      //   13, // font size
      //   15, // max lines
      // );

      const normalizedText = normalizeAdText(
        finalAdvertisementText,
        agency.ad_text_type,
      );
      const { COLUMN_X, ROW_Y } = getCoordinates(agency.publisher_name);
      const wordsToPrint = Math.min(
        normalizedText.length,
        MAX_WORDS,
        COLUMN_X.length * ROW_Y.length,
      );

      // Draw ad text
      for (let i = 0; i < wordsToPrint; i++) {
        const col = i % COLUMN_X.length;
        const row = Math.floor(i / COLUMN_X.length);
        if (row >= ROW_Y.length) break;

        const text = normalizedText[i];
        // wijeya newspapers - text print
        // if (SINHALA_REGEX.test(text)) {
        //   const pngBuffer = renderSinhalaTextToImage(text, 22);
        //   const pngImage = await pdfDoc.embedPng(pngBuffer);
        //   const dims = pngImage.scale(0.5); // adjust scale to fit

        //   page.drawImage(pngImage, {
        //     x: COLUMN_X[col],
        //     y: ROW_Y[row] - dims.height, // shift down by image height
        //     width: dims.width,
        //     height: dims.height,
        //   });
        // } else {
        //   page.drawText(text, {
        //     x: COLUMN_X[col],
        //     y: ROW_Y[row],
        //     size: 10,
        //     font: englishFont,
        //   });
        // }
        const pngBuffer = renderSinhalaTextToImage(text, 22);
        const pngImage = await pdfDoc.embedPng(pngBuffer);
        const dims = pngImage.scale(0.5);

        page.drawImage(pngImage, {
          x: COLUMN_X[col],
          y: ROW_Y[row] - dims.height,
          width: dims.width,
          height: dims.height,
        });
      }
    }
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=advertisement-print.pdf",
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json(
      { error: "PDF generation failed" },
      { status: 500 },
    );
  }
}
