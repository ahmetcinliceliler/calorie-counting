import { deps, JSON_MODE, llmConfig } from '../_shared/deno-deps.ts';
import { createAiEndpoint } from '../_shared/endpoint.ts';
import { completeJson, imagePart } from '../_shared/llm.ts';
import { photoPrompt } from '../_shared/prompts.ts';
import { analyzePhotoRequestSchema, photoAnalysisSchema } from '../_shared/schemas.ts';

Deno.serve(
  createAiEndpoint(
    'analyze_photo',
    analyzePhotoRequestSchema,
    ({ imageBase64, mimeType, locale }) => {
      const prompt = photoPrompt(locale);
      return completeJson(
        llmConfig('vision'),
        [
          { role: 'system', content: prompt.system },
          // Görsel metinden önce: VLM'lerde daha iyi sonuç verir.
          { role: 'user', content: [imagePart(imageBase64, mimeType), { type: 'text', text: prompt.user }] },
        ],
        photoAnalysisSchema,
        { maxTokens: 1200, jsonMode: JSON_MODE },
      );
    },
    deps,
  ),
);
