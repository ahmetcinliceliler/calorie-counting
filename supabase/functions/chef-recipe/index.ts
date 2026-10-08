import { deps, JSON_MODE, llmConfig } from '../_shared/deno-deps.ts';
import { createAiEndpoint } from '../_shared/endpoint.ts';
import { completeJson } from '../_shared/llm.ts';
import { recipePrompt } from '../_shared/prompts.ts';
import { chefRecipeRequestSchema, recipeSchema } from '../_shared/schemas.ts';

Deno.serve(
  createAiEndpoint(
    'chef_recipe',
    chefRecipeRequestSchema,
    ({ prompt: request, maxKcal, locale }) => {
      const prompt = recipePrompt(request, locale, maxKcal);
      return completeJson(
        llmConfig('text'),
        [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user },
        ],
        recipeSchema,
        { maxTokens: 1500, temperature: 0.6, jsonMode: JSON_MODE },
      );
    },
    deps,
  ),
);
