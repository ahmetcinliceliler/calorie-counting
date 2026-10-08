import { FunctionsHttpError, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import {
  errorResponseSchema,
  photoAnalysisSchema,
  productEstimateSchema,
  quotaSchema,
  recipeSchema,
  type AnalyzePhotoRequest,
  type ChefRecipeRequest,
  type ErrorCode,
  type EstimateProductRequest,
  type PhotoAnalysis,
  type ProductEstimate,
  type Quota,
  type Recipe,
} from '../../supabase/functions/_shared/schemas';
import { ensureSession, supabase } from './supabase';

export type AiErrorCode = ErrorCode | 'not_configured' | 'network';

export class AiError extends Error {
  constructor(
    public readonly code: AiErrorCode,
    message: string,
    public readonly quota?: Quota,
  ) {
    super(message);
    this.name = 'AiError';
  }
}

export interface AiResult<T> {
  data: T;
  quota: Quota;
}

/** Bir Edge Function'ı çağırır; yanıtı şemayla doğrular, hataları AiError'a çevirir. */
export async function invokeAi<S extends z.ZodTypeAny>(
  client: SupabaseClient | null,
  fn: string,
  body: Record<string, unknown>,
  dataSchema: S,
): Promise<AiResult<z.infer<S>>> {
  if (!client) throw new AiError('not_configured', 'Supabase is not configured');

  try {
    await ensureSession(client);
  } catch {
    throw new AiError('network', 'could not start session');
  }

  const { data, error } = await client.functions.invoke(fn, { body });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null);
      const parsed = errorResponseSchema.safeParse(payload);
      if (parsed.success) {
        throw new AiError(parsed.data.error.code, parsed.data.error.message, parsed.data.quota);
      }
      throw new AiError('internal', `function ${fn} failed`);
    }
    throw new AiError('network', error.message);
  }

  const parsed = z.object({ data: dataSchema, quota: quotaSchema }).safeParse(data);
  if (!parsed.success) throw new AiError('ai_bad_output', 'unexpected response shape');
  return parsed.data as AiResult<z.infer<S>>;
}

export const analyzePhoto = (req: AnalyzePhotoRequest): Promise<AiResult<PhotoAnalysis>> =>
  invokeAi(supabase, 'analyze-photo', req, photoAnalysisSchema);

export const estimateProduct = (req: EstimateProductRequest): Promise<AiResult<ProductEstimate>> =>
  invokeAi(supabase, 'estimate-product', req, productEstimateSchema);

export const chefRecipe = (req: ChefRecipeRequest): Promise<AiResult<Recipe>> =>
  invokeAi(supabase, 'chef-recipe', req, recipeSchema);
