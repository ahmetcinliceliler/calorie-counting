// AI uç noktalarının ortak akışı. Deno'ya bağımlı değil; bağımlılıklar dışarıdan verilir.
import type { z } from 'zod';

import { LlmError } from './llm.ts';
import { quotaSchema, type ErrorCode, type Quota } from './schemas.ts';

export type Feature = 'analyze_photo' | 'estimate_product' | 'chef_recipe';

export interface EndpointDeps {
  /** Authorization başlığındaki JWT'den kullanıcıyı çözer; geçersizse null. */
  getUserId: (authHeader: string | null) => Promise<string | null>;
  /** consume_ai_quota RPC'si (kullanıcının JWT'siyle). */
  consumeQuota: (authHeader: string, feature: Feature) => Promise<unknown>;
  /** refund_ai_quota RPC'si (servis rolüyle). */
  refundQuota: (userId: string, feature: Feature) => Promise<void>;
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const STATUS: Record<ErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401,
  quota_exceeded: 429,
  ai_unavailable: 503,
  ai_bad_output: 502,
  internal: 500,
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function errorResponse(code: ErrorCode, message: string, quota?: Quota): Response {
  return json({ error: { code, message }, ...(quota ? { quota } : {}) }, STATUS[code]);
}

export function createAiEndpoint<Req extends z.ZodTypeAny, Res>(
  feature: Feature,
  requestSchema: Req,
  run: (input: z.infer<Req>) => Promise<Res>,
  deps: EndpointDeps,
) {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    if (req.method !== 'POST') return errorResponse('bad_request', 'POST only');

    const auth = req.headers.get('Authorization');
    const userId = await deps.getUserId(auth).catch(() => null);
    if (!auth || !userId) return errorResponse('unauthorized', 'sign-in required');

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponse('bad_request', 'invalid JSON body');
    }
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return errorResponse('bad_request', `${issue?.path.join('.') || 'body'}: ${issue?.message}`);
    }

    let quota: Quota;
    try {
      quota = quotaSchema.parse(await deps.consumeQuota(auth, feature));
    } catch (err) {
      console.error(`[${feature}] quota error`, err);
      return errorResponse('internal', 'quota check failed');
    }
    if (!quota.allowed) return errorResponse('quota_exceeded', 'daily limit reached', quota);

    try {
      const result = await run(parsed.data);
      return json({ data: result, quota });
    } catch (err) {
      // AI başarısız olduysa kullanıcının hakkını geri ver.
      await deps.refundQuota(userId, feature).catch((e) => console.error(`[${feature}] refund failed`, e));
      if (err instanceof LlmError) {
        console.error(`[${feature}] llm ${err.kind}: ${err.message}`);
        return err.kind === 'unavailable'
          ? errorResponse('ai_unavailable', 'AI service unavailable, try again')
          : errorResponse('ai_bad_output', 'AI could not produce a valid result');
      }
      console.error(`[${feature}] unexpected`, err);
      return errorResponse('internal', 'unexpected error');
    }
  };
}
