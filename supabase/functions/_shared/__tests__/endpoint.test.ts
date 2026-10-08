import { z } from 'zod';

import { createAiEndpoint, type EndpointDeps } from '../endpoint.ts';
import { LlmError } from '../llm.ts';

const schema = z.object({ text: z.string().min(1) });
const okQuota = { allowed: true, premium: false, limit: 3, remaining: 2 };

function makeDeps(overrides: Partial<EndpointDeps> = {}): EndpointDeps & { refundQuota: jest.Mock } {
  return {
    getUserId: jest.fn(async (h) => (h === 'Bearer good' ? 'user-1' : null)),
    consumeQuota: jest.fn(async () => okQuota),
    refundQuota: jest.fn(async () => {}),
    ...overrides,
  } as any;
}

function request(body: unknown, auth = 'Bearer good', method = 'POST') {
  return new Request('https://fn.test', {
    method,
    headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) },
    body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });
}

async function call(handler: (r: Request) => Promise<Response>, req: Request) {
  const res = await handler(req);
  return { status: res.status, body: res.status === 200 && req.method === 'OPTIONS' ? null : await res.json() };
}

describe('createAiEndpoint', () => {
  it('başarılı istekte sonucu ve kotayı döner', async () => {
    const deps = makeDeps();
    const handler = createAiEndpoint('chef_recipe', schema, async ({ text }) => ({ echo: text }), deps);
    const { status, body } = await call(handler, request({ text: 'menemen' }));
    expect(status).toBe(200);
    expect(body).toEqual({ data: { echo: 'menemen' }, quota: okQuota });
    expect(deps.consumeQuota).toHaveBeenCalledWith('Bearer good', 'chef_recipe');
  });

  it('oturum yoksa 401 ve kota harcanmaz', async () => {
    const deps = makeDeps();
    const handler = createAiEndpoint('chef_recipe', schema, async () => ({}), deps);
    const { status, body } = await call(handler, request({ text: 'x' }, 'Bearer bad'));
    expect(status).toBe(401);
    expect(body.error.code).toBe('unauthorized');
    expect(deps.consumeQuota).not.toHaveBeenCalled();
  });

  it('geçersiz gövdede 400 ve kota harcanmaz', async () => {
    const deps = makeDeps();
    const handler = createAiEndpoint('chef_recipe', schema, async () => ({}), deps);
    expect((await call(handler, request({ text: '' }))).status).toBe(400);
    expect((await call(handler, request('{bozuk'))).status).toBe(400);
    expect(deps.consumeQuota).not.toHaveBeenCalled();
  });

  it('kota dolduysa 429 ve AI çağrılmaz', async () => {
    const quota = { allowed: false, premium: false, limit: 3, remaining: 0 };
    const run = jest.fn();
    const handler = createAiEndpoint('analyze_photo', schema, run, makeDeps({ consumeQuota: async () => quota }));
    const { status, body } = await call(handler, request({ text: 'x' }));
    expect(status).toBe(429);
    expect(body).toEqual({ error: { code: 'quota_exceeded', message: 'daily limit reached' }, quota });
    expect(run).not.toHaveBeenCalled();
  });

  it('AI başarısız olursa kotayı iade eder', async () => {
    const deps = makeDeps();
    const handler = createAiEndpoint(
      'analyze_photo',
      schema,
      async () => {
        throw new LlmError('unavailable', 'timeout');
      },
      deps,
    );
    const { status, body } = await call(handler, request({ text: 'x' }));
    expect(status).toBe(503);
    expect(body.error.code).toBe('ai_unavailable');
    expect(deps.refundQuota).toHaveBeenCalledWith('user-1', 'analyze_photo');
  });

  it('bozuk AI çıktısı 502 olur, sağlayıcı ayrıntısı sızmaz', async () => {
    const handler = createAiEndpoint(
      'analyze_photo',
      schema,
      async () => {
        throw new LlmError('bad_output', 'secret provider detail');
      },
      makeDeps(),
    );
    const { status, body } = await call(handler, request({ text: 'x' }));
    expect(status).toBe(502);
    expect(JSON.stringify(body)).not.toContain('secret');
  });

  it('OPTIONS isteğine CORS ile cevap verir', async () => {
    const handler = createAiEndpoint('chef_recipe', schema, async () => ({}), makeDeps());
    const res = await handler(request(null, '', 'OPTIONS'));
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});
