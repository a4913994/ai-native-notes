import { afterEach, describe, expect, it } from 'bun:test';
import { loadNews } from '../news';

const original = globalThis.fetch;
afterEach(() => { globalThis.fetch = original; });
describe('News reading cache', () => {
  it('shares requests during navigation and allows an explicit refresh', async () => {
    let calls = 0;
    globalThis.fetch = (async () => new Response(JSON.stringify({ count: ++calls }), { headers: { 'Content-Type': 'application/json' } })) as typeof fetch;
    const [first, second] = await Promise.all([loadNews('/cache-test'), loadNews('/cache-test')]);
    expect(first).toEqual(second);
    expect(calls).toBe(1);
    expect(await loadNews<{count: number}>('/cache-test', true)).toEqual({ count: 2 });
  });
  it('does not cache failed requests', async () => {
    let calls = 0;
    globalThis.fetch = (async () => new Response('{}', { status: ++calls === 1 ? 503 : 200 })) as typeof fetch;
    await expect(loadNews('/failed-cache-test')).rejects.toThrow('error');
    expect(await loadNews<Record<string, unknown>>('/failed-cache-test')).toEqual({});
    expect(calls).toBe(2);
  });
});
