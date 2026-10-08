// Deno çalışma zamanına özgü bağlantılar: ortam değişkenleri ve Supabase istemcileri.
// Jest bu dosyayı import etmez.
import { createClient } from '@supabase/supabase-js';

import type { EndpointDeps } from './endpoint.ts';
import type { LlmConfig } from './llm.ts';

function env(name: string, fallback?: string): string {
  const value = Deno.env.get(name) ?? fallback;
  if (!value) throw new Error(`missing env ${name}`);
  return value;
}

/** Yeni anahtar sözlüklerinden 'default' anahtarı; yoksa eski (legacy) tekil değişken. */
function supabaseKey(dictVar: string, legacyVar: string): string {
  const dict = Deno.env.get(dictVar);
  if (dict) {
    const key = (JSON.parse(dict) as Record<string, string>)['default'];
    if (key) return key;
  }
  return env(legacyVar);
}

const SUPABASE_URL = env('SUPABASE_URL');
const PUBLISHABLE_KEY = supabaseKey('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY');
const SECRET_KEY = supabaseKey('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY');

const admin = createClient(SUPABASE_URL, SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function userClient(authHeader: string) {
  return createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const deps: EndpointDeps = {
  async getUserId(authHeader) {
    const token = authHeader?.replace(/^Bearer\s+/i, '');
    if (!token) return null;
    const { data, error } = await admin.auth.getUser(token);
    return error ? null : (data.user?.id ?? null);
  },
  async consumeQuota(authHeader, feature) {
    const { data, error } = await userClient(authHeader).rpc('consume_ai_quota', { p_feature: feature });
    if (error) throw error;
    return data;
  },
  async refundQuota(userId, feature) {
    const { error } = await admin.rpc('refund_ai_quota', { p_user: userId, p_feature: feature });
    if (error) throw error;
  },
};

/**
 * AI sağlayıcı ayarları (Supabase secrets):
 *   AI_BASE_URL      örn. https://integrate.api.nvidia.com/v1
 *   AI_API_KEY       sağlayıcı anahtarı (nvapi-...)
 *   AI_VISION_MODEL  görsel destekli model (fotoğraf analizi)
 *   AI_TEXT_MODEL    metin modeli (ürün tahmini, tarif); yoksa AI_VISION_MODEL
 */
export function llmConfig(kind: 'vision' | 'text'): LlmConfig {
  const vision = env('AI_VISION_MODEL');
  return {
    baseUrl: env('AI_BASE_URL', 'https://integrate.api.nvidia.com/v1'),
    apiKey: env('AI_API_KEY'),
    model: kind === 'vision' ? vision : env('AI_TEXT_MODEL', vision),
    timeoutMs: Number(Deno.env.get('AI_TIMEOUT_MS') ?? 45_000),
  };
}

/** Sağlayıcı response_format: json_object destekliyorsa açılır (varsayılan kapalı). */
export const JSON_MODE = Deno.env.get('AI_JSON_MODE') === 'true';
