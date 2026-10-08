import { deps, JSON_MODE, llmConfig } from '../_shared/deno-deps.ts';
import { createAiEndpoint } from '../_shared/endpoint.ts';
import { completeJson } from '../_shared/llm.ts';
import { productPrompt } from '../_shared/prompts.ts';
import { estimateProductRequestSchema, productEstimateSchema } from '../_shared/schemas.ts';

Deno.serve(
  createAiEndpoint(
    'estimate_product',
    estimateProductRequestSchema,
    ({ productName, locale }) => {
      const prompt = productPrompt(productName, locale);
      return completeJson(
        llmConfig('text'),
        [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user },
        ],
        productEstimateSchema,
        { maxTokens: 400, jsonMode: JSON_MODE },
      );
    },
    deps,
  ),
);
