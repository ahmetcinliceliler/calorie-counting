import { chatCompletion, completeJson, extractJson, LlmError, type LlmConfig } from '../llm.ts';
import { photoAnalysisSchema } from '../schemas.ts';

const config: LlmConfig = { baseUrl: 'https://llm.test/v1/', apiKey: 'k', model: 'm' };

function fakeFetch(...contents: (string | { status: number })[]) {
  const calls: { url: string; body: any; headers: any }[] = [];
  let i = 0;
  const fn = jest.fn(async (url: string, init: any) => {
    calls.push({ url, body: JSON.parse(init.body), headers: init.headers });
    const next = contents[Math.min(i++, contents.length - 1)];
    if (typeof next !== 'string') {
      return { ok: false, status: next.status, text: async () => 'err' } as any;
    }
    return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: next } }] }) } as any;
  });
  return { fn: fn as unknown as typeof fetch, calls };
}

describe('extractJson', () => {
  it('çitli JSON ve açıklama metnini temizler', () => {
    expect(extractJson('İşte sonuç:\n```json\n{"a": 1}\n```\nAfiyet olsun')).toEqual({ a: 1 });
  });

  it('<think> bloklarını yok sayar', () => {
    expect(extractJson('<think>{"wrong": true}</think>{"ok": true}')).toEqual({ ok: true });
  });

  it('string içindeki parantezlere takılmaz', () => {
    expect(extractJson('{"name": "Tost {kaşarlı}", "n": [1, 2]} sonrası')).toEqual({
      name: 'Tost {kaşarlı}',
      n: [1, 2],
    });
  });

  it('JSON yoksa bad_output', () => {
    expect(() => extractJson('üzgünüm, yardımcı olamam')).toThrow(LlmError);
  });
});

describe('chatCompletion', () => {
  it('OpenAI uyumlu isteği doğru adrese ve başlıkla gönderir', async () => {
    const { fn, calls } = fakeFetch('merhaba');
    await expect(chatCompletion(config, [{ role: 'user', content: 'x' }], {}, fn)).resolves.toBe('merhaba');
    expect(calls[0].url).toBe('https://llm.test/v1/chat/completions');
    expect(calls[0].headers.Authorization).toBe('Bearer k');
    expect(calls[0].body).toMatchObject({ model: 'm', stream: false });
    expect(calls[0].body.response_format).toBeUndefined();
  });

  it('HTTP hatasında unavailable', async () => {
    const { fn } = fakeFetch({ status: 429 });
    await expect(chatCompletion(config, [], {}, fn)).rejects.toMatchObject({ kind: 'unavailable', status: 429 });
  });
});

describe('completeJson', () => {
  const valid = '{"items":[{"name":"Elma","grams":"150","kcal":78,"protein":0.4,"carbs":21,"fat":0.3}]}';

  it('geçerli çıktıyı doğrular ve sayıları dönüştürür', async () => {
    const { fn } = fakeFetch(valid);
    const result = await completeJson(config, [{ role: 'user', content: 'x' }], photoAnalysisSchema, {}, fn);
    expect(result.items[0]).toMatchObject({ name: 'Elma', grams: 150, confidence: 0.5 });
  });

  it('geçersiz çıktıda hatayı modele bildirip bir kez yeniden dener', async () => {
    const { fn, calls } = fakeFetch('{"items":[{"name":"Elma"}]}', valid);
    const result = await completeJson(config, [{ role: 'user', content: 'x' }], photoAnalysisSchema, {}, fn);
    expect(result.items).toHaveLength(1);
    expect(calls).toHaveLength(2);
    const retryMessages = calls[1].body.messages;
    expect(retryMessages.at(-1).content).toContain('invalid');
  });

  it('iki denemede de geçersizse bad_output', async () => {
    const { fn } = fakeFetch('saçma');
    await expect(
      completeJson(config, [{ role: 'user', content: 'x' }], photoAnalysisSchema, {}, fn),
    ).rejects.toMatchObject({ kind: 'bad_output' });
  });
});
