// types/newspaperSchema.ts
import { z } from "zod";

// Single ad type schema (classified, photoClassified, casual)
export const adTypeSchema = z.object({
  countFirstWords: z.number(),
  basePrice: z.number(),
  additionalWordPrice: z.number(),
  colorOptions: z.array(z.enum(["blackWhite", "color"])),
  tintColorPrice: z.number(),
  maxWords: z.number(),
});

// All ad types for a newspaper
export const newspaperAdSchema = z.object({
  classified: adTypeSchema,
  photoClassified: adTypeSchema,
  casual: adTypeSchema,
});

// Single newspaper schema
export const newspaperSchema = z.object({
  name: z.string(),
  type: z.string(), // "daily" or "sunday"
  noColPerPage: z.number(),
  colWidth: z.number(),
  colHeight: z.number(),
  minAdHeight: z.number(),
  tintAdditionalCharge: z.number(),
  typeofAd: newspaperAdSchema,
});

// The full data: keys like daily0, sunday0
export const newspaperDataSchema = z.record(z.string(), newspaperSchema);

// Typescript types
export type AdType = z.infer<typeof adTypeSchema>;
export type NewspaperAd = z.infer<typeof newspaperAdSchema>;
export type Newspaper = z.infer<typeof newspaperSchema>;
export type NewspaperData = z.infer<typeof newspaperDataSchema>;
