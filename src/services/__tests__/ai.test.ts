import { FunctionsHttpError } from '@supabase/supabase-js';

import { recipeSchema } from '../../../supabase/functions/_shared/schemas';
import { AiError, invokeAi } from '../ai';

jest.mock('../supabase', () => ({
  supabase: null,
  ensureSession: jest.fn(async () => {}),
}));

const quota = { allowed: true, premium: false, limit: 2, remaining: 1 };
const recipe = {
  title: 'Mercimek çorbası',
  servings: 2,
  kcal: 180,
  protein: 10,
  carbs: 25,
  fat: 4,
  ingredients: ['mercimek'],
  steps: ['kaynat'],
};

function client(result: { data?: unknown; error?: unknown }) {
  return { functions: { invoke: jest.fn(async () => ({ data: null, error: null, ...result })) } } as any;
}

function httpError(status: number, body: unknown) {
  return new FunctionsHttpError(new Response(JSON.stringify(body), { status }));
}

describe('invokeAi', () => {
  it('Supabase ayarlı değilse not_configured', async () => {
    await expect(invokeAi(null, 'chef-recipe', {}, recipeSchema)).rejects.toMatchObject({ code: 'not_configured' });
  });

  it('başarılı yanıtı doğrular', async () => {
    const c = client({ data: { data: recipe, quota } });
    await expect(invokeAi(c, 'chef-recipe', { prompt: 'çorba' }, recipeSchema)).resolves.toEqual({
      data: recipe,
      quota,
    });
    expect(c.functions.invoke).toHaveBeenCalledWith('chef-recipe', { body: { prompt: 'çorba' } });
  });

  it('kota hatasını kod ve kota bilgisiyle iletir', async () => {
    const exhausted = { allowed: false, premium: false, limit: 2, remaining: 0 };
    const c = client({
      error: httpError(429, { error: { code: 'quota_exceeded', message: 'daily limit reached' }, quota: exhausted }),
    });
    const err: AiError = await invokeAi(c, 'chef-recipe', {}, recipeSchema).catch((e) => e);
    expect(err).toBeInstanceOf(AiError);
    expect(err.code).toBe('quota_exceeded');
    expect(err.quota).toEqual(exhausted);
  });

  it('beklenmeyen yanıt şeklini reddeder', async () => {
    const c = client({ data: { data: { title: '' }, quota } });
    await expect(invokeAi(c, 'chef-recipe', {}, recipeSchema)).rejects.toMatchObject({ code: 'ai_bad_output' });
  });
});
