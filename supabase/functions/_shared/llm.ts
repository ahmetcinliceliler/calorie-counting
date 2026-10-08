// OpenAI uyumlu /chat/completions istemcisi.
// Sağlayıcı (NVIDIA API catalog, Gemini OpenAI uyumlu ucu, OpenRouter, vb.) tamamen
// ortam değişkenleriyle seçilir; kod değişmez.
import type { z } from 'zod';

export interface LlmConfig {
  baseUrl: string; // örn. https://integrate.api.nvidia.com/v1
  apiKey: string;
  model: string;
  timeoutMs?: number;
}

export type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentPart[];
}

export class LlmError extends Error {
  constructor(
    public readonly kind: 'unavailable' | 'bad_output',
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'LlmError';
  }
}

export function imagePart(base64: string, mimeType: string): ContentPart {
  return { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } };
}

/**
 * Model metninden ilk JSON nesnesini çıkarır.
 * ```json çitlerini, öncesindeki/sonrasındaki açıklamaları ve <think> bloklarını tolere eder.
 */
export function extractJson(text: string): unknown {
  const cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/```(?:json)?/gi, '')
    .trim();

  const start = cleaned.search(/[[{]/);
  if (start === -1) throw new LlmError('bad_output', 'no JSON found in model output');

  const open = cleaned[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === open) depth++;
    else if (ch === close && --depth === 0) {
      try {
        return JSON.parse(cleaned.slice(start, i + 1));
      } catch {
        throw new LlmError('bad_output', 'model output is not valid JSON');
      }
    }
  }
  throw new LlmError('bad_output', 'unterminated JSON in model output');
}

type FetchFn = typeof fetch;

export async function chatCompletion(
  config: LlmConfig,
  messages: ChatMessage[],
  options: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {},
  fetchFn: FetchFn = fetch,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs ?? 45_000);

  try {
    const res = await fetchFn(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 1024,
        stream: false,
        ...(options.jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
    });

    if (!res.ok) {
      // Gövdeyi loglarız ama istemciye sızdırmayız.
      const body = await res.text().catch(() => '');
      console.error(`LLM HTTP ${res.status}: ${body.slice(0, 500)}`);
      throw new LlmError('unavailable', `provider returned ${res.status}`, res.status);
    }

    const data = (await res.json()) as { choices?: { message?: { content?: unknown } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.length === 0) {
      throw new LlmError('bad_output', 'empty completion');
    }
    return content;
  } catch (err) {
    if (err instanceof LlmError) throw err;
    const aborted = err instanceof Error && err.name === 'AbortError';
    throw new LlmError('unavailable', aborted ? 'provider timeout' : String(err));
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Sohbet tamamlamasını çağırır, JSON'u çıkarır ve şemayla doğrular.
 * Geçersiz çıktıda bir kez, hatayı modele bildirerek yeniden dener.
 */
export async function completeJson<S extends z.ZodTypeAny>(
  config: LlmConfig,
  messages: ChatMessage[],
  schema: S,
  options: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {},
  fetchFn: FetchFn = fetch,
): Promise<z.infer<S>> {
  let lastError = 'unknown';
  let convo = messages;

  for (let attempt = 0; attempt < 2; attempt++) {
    const text = await chatCompletion(config, convo, options, fetchFn);
    try {
      const parsed = schema.safeParse(extractJson(text));
      if (parsed.success) return parsed.data;
      lastError = parsed.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
    convo = [
      ...messages,
      { role: 'assistant', content: text },
      {
        role: 'user',
        content: `Your previous answer was invalid (${lastError}). Reply again with ONLY the corrected JSON object.`,
      },
    ];
  }
  throw new LlmError('bad_output', lastError);
}
