// Edge Functions ile mobil uygulamanın ORTAK sözleşmesi.
// Bu dosya hem Deno'da (deno.json import map'i ile) hem de uygulamada kullanılır;
// bu yüzden sadece 'zod' import eder, Deno'ya özgü hiçbir şey içermez.
import { z } from 'zod';

const nonNeg = z.coerce.number().finite().min(0);

export const nutrientsSchema = z.object({
  kcal: nonNeg,
  protein: nonNeg,
  carbs: nonNeg,
  fat: nonNeg,
});

// ---- analyze-photo ---------------------------------------------------------

export const detectedItemSchema = nutrientsSchema.extend({
  name: z.string().trim().min(1).max(80),
  grams: z.coerce.number().finite().positive().max(3000),
  confidence: z.coerce.number().min(0).max(1).catch(0.5),
});

export const photoAnalysisSchema = z.object({
  items: z.array(detectedItemSchema).max(12),
});

export const analyzePhotoRequestSchema = z.object({
  imageBase64: z.string().min(100).max(8_000_000),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  locale: z.string().default('tr'),
});

// ---- estimate-product ------------------------------------------------------

export const productEstimateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  per100g: nutrientsSchema,
  packageGrams: z.coerce.number().finite().positive().max(5000).nullable().catch(null),
});

export const estimateProductRequestSchema = z.object({
  productName: z.string().trim().min(2).max(120),
  barcode: z.string().regex(/^\d{8,14}$/).optional(),
  locale: z.string().default('tr'),
});

// ---- chef-recipe -----------------------------------------------------------

export const recipeSchema = nutrientsSchema.extend({
  title: z.string().trim().min(1).max(120),
  servings: z.coerce.number().int().min(1).max(12).catch(1),
  ingredients: z.array(z.string().trim().min(1)).min(1).max(30),
  steps: z.array(z.string().trim().min(1)).min(1).max(20),
});

export const chefRecipeRequestSchema = z.object({
  prompt: z.string().trim().min(3).max(500),
  maxKcal: z.number().int().min(100).max(2000).optional(),
  locale: z.string().default('tr'),
});

// ---- Ortak yanıt zarfı -----------------------------------------------------

export const quotaSchema = z.object({
  allowed: z.boolean(),
  premium: z.boolean(),
  limit: z.number().nullable(),
  remaining: z.number().nullable(),
});

export const errorCodes = [
  'bad_request',
  'unauthorized',
  'quota_exceeded',
  'ai_unavailable',
  'ai_bad_output',
  'internal',
] as const;
export type ErrorCode = (typeof errorCodes)[number];

export const errorResponseSchema = z.object({
  error: z.object({ code: z.enum(errorCodes), message: z.string() }),
  quota: quotaSchema.optional(),
});

export type Nutrients = z.infer<typeof nutrientsSchema>;
export type DetectedItem = z.infer<typeof detectedItemSchema>;
export type PhotoAnalysis = z.infer<typeof photoAnalysisSchema>;
export type ProductEstimate = z.infer<typeof productEstimateSchema>;
export type Recipe = z.infer<typeof recipeSchema>;
export type Quota = z.infer<typeof quotaSchema>;
export type AnalyzePhotoRequest = z.input<typeof analyzePhotoRequestSchema>;
export type EstimateProductRequest = z.input<typeof estimateProductRequestSchema>;
export type ChefRecipeRequest = z.input<typeof chefRecipeRequestSchema>;
