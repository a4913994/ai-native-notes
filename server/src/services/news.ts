import { and, desc, eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { validNewsDate, validateNewsInput, type NewsDigest, type NewsInput } from '@rin/api';
import type { Variables } from '../core/hono-types';
import { newsDigests } from '../db/schema';

function serialize(row: typeof newsDigests.$inferSelect): NewsDigest {
    return { ...JSON.parse(row.payload) as NewsInput, date: row.date, publishedAt: row.publishedAt, updatedAt: row.updatedAt };
}
async function authorized(header: string | undefined, secret: string | undefined) {
    if (!secret || !header?.startsWith('Bearer ')) return false;
    const digest = async (s: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
    const [a, b] = await Promise.all([digest(header.slice(7)), digest(secret)]);
    let difference = 0;
    for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
    return difference === 0;
}
export function NewsService() {
    const app = new Hono<{ Bindings: Env; Variables: Variables }>();
    app.use('*', async (c, next) => { c.header('Cache-Control', 'no-store'); await next(); });
    app.get('/', async c => {
        const page = Number(c.req.query('page') || 1);
        if (!Number.isInteger(page) || page < 1 || page > 10000) return c.json({ error: 'Invalid page' }, 400);
        const rows = await c.get('db').select().from(newsDigests).where(eq(newsDigests.language, 'zh'))
            .orderBy(desc(newsDigests.date)).limit(21).offset((page - 1) * 20);
        return c.json({ data: rows.slice(0, 20).map(row => { const { content, ...metadata } = serialize(row); return metadata; }), hasNext: rows.length > 20 });
    });
    app.get('/:date', async c => {
        const date = c.req.param('date');
        if (!validNewsDate(date)) return c.json({ error: 'Invalid date' }, 400);
        const [row] = await c.get('db').select().from(newsDigests).where(and(eq(newsDigests.date, date), eq(newsDigests.language, 'zh'))).limit(1);
        return row ? c.json(serialize(row)) : c.json({ error: 'Not found' }, 404);
    });
    app.put('/:date', bodyLimit({ maxSize: 2000000 }), async c => {
        if (!await authorized(c.req.header('authorization'), c.env.NEWS_SYNC_TOKEN)) return c.json({ error: 'Forbidden' }, 403);
        const date = c.req.param('date');
        let body: unknown;
        try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }
        if (!validNewsDate(date) || !validateNewsInput(body)) return c.json({ error: 'Invalid digest' }, 400);
        const generated = new Date(body.generatedAt).toISOString();
        const localDate = new Date(Date.parse(body.windowEnd) + 8 * 3600000).toISOString().slice(0, 10);
        if (localDate !== date || Date.parse(generated) > Date.now() + 300000) return c.json({ error: 'Digest date mismatch' }, 400);
        const now = new Date().toISOString();
        await c.get('db').insert(newsDigests).values({ date, language: 'zh', payload: JSON.stringify(body), generatedAt: generated, publishedAt: now, updatedAt: now })
            .onConflictDoUpdate({ target: [newsDigests.date, newsDigests.language], set: { payload: JSON.stringify(body), generatedAt: generated, updatedAt: now }, setWhere: sql`${newsDigests.generatedAt} < ${generated}` });
        return c.json({ success: true, date });
    });
    return app;
}
