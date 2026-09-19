import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { NewsService } from '../news';
import { setupTestApp, cleanupTestDB } from '../../../tests/fixtures';

describe('Daily news publishing', () => {
    let ctx: Awaited<ReturnType<typeof setupTestApp>>;
    const input = { language: 'zh', title: '每日资讯', summary: 'One story', content: '## Test\n\n[Source](https://example.com)', status: 'ready', windowStart: '2026-09-17T23:37:00.000Z', windowEnd: '2026-09-18T23:37:00.000Z', generatedAt: '2026-09-19T00:00:00.000Z', sourceWarnings: [] };
    const headers = { Authorization: 'Bearer news-test-secret', 'Content-Type': 'application/json' };
    const put = (body = input, auth = headers) => ctx.app.request('/2026-09-19', { method: 'PUT', headers: auth, body: JSON.stringify(body) }, ctx.env);
    beforeEach(async () => {
        ctx = await setupTestApp(NewsService);
        ctx.env.NEWS_SYNC_TOKEN = 'news-test-secret';
        ctx.sqlite.exec(readFileSync(new URL('../../../sql/0013.sql', import.meta.url), 'utf8'));
    });
    afterEach(() => cleanupTestDB(ctx.sqlite));
    it('requires a dedicated secret and rejects bad dates, JSON and windows', async () => {
        expect((await put(input, { ...headers, Authorization: 'Bearer mock_token_1' })).status).toBe(403);
        expect((await put({ ...input, windowEnd: '2026-09-17T00:00:00.000Z' })).status).toBe(400);
        expect((await put({ ...input, language: 'en' })).status).toBe(400);
        expect((await ctx.app.request('/2026-02-30', {}, ctx.env)).status).toBe(400);
        expect((await ctx.app.request('/?page=0', {}, ctx.env)).status).toBe(400);
        expect((await ctx.app.request('/2026-09-19', { method: 'PUT', headers, body: '{' }, ctx.env)).status).toBe(400);
    });
    it('publishes independently, reads anonymously and does not expose bodies in lists', async () => {
        expect((await put()).status).toBe(200);
        const response = await ctx.app.request('/2026-09-19', {}, ctx.env);
        expect(response.headers.get('cache-control')).toBe('no-store');
        expect(await response.json()).toMatchObject(input);
        const list = await (await ctx.app.request('/', {}, ctx.env)).json() as any;
        expect(list.data).toHaveLength(1);
        expect(list.data[0].content).toBeUndefined();
        expect(ctx.sqlite.query('select count(*) as n from feeds').get()).toEqual({ n: 0 });
    });
    it('deduplicates retries and concurrent writes; older generation cannot replace newer', async () => {
        await Promise.all([put(), put(), put()]);
        const first = await (await ctx.app.request('/2026-09-19', {}, ctx.env)).json() as any;
        const newer = { ...input, content: 'Newer', generatedAt: '2026-09-19T00:01:00.000Z' };
        await put(newer); await put();
        const saved = await (await ctx.app.request('/2026-09-19', {}, ctx.env)).json() as any;
        expect(saved.content).toBe('Newer');
        expect(saved.publishedAt).toBe(first.publishedAt);
        expect(ctx.sqlite.query('select count(*) as n from news_digests').get()).toEqual({ n: 1 });
    });
    it('accepts explicit empty editions and keeps missing dates absent', async () => {
        expect((await put({ ...input, status: 'empty', content: '今天没有符合标准的资讯。' })).status).toBe(200);
        expect((await ctx.app.request('/2026-09-20', {}, ctx.env)).status).toBe(404);
    });
});
