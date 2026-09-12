import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { FeedService } from '../feed';
import { setupTestApp, createTestUser, cleanupTestDB } from '../../../tests/fixtures';

describe('Feed language tags, pagination and cache visibility', () => {
  let ctx: Awaited<ReturnType<typeof setupTestApp>>;
  const headers = { Authorization: 'Bearer mock_token_1', 'Content-Type': 'application/json' };
  async function create(title: string, tags: string[], visibility = { draft: false, listed: true }) {
    const response = await ctx.app.request('/', { method: 'POST', headers,
      body: JSON.stringify({ title, content: `Fixture ${title}`, tags, ...visibility }),
    }, ctx.env);
    expect(response.status).toBe(200);
    return (await response.json() as { insertedId: number }).insertedId;
  }
  async function list(tag?: string, page = 1, admin = false) {
    const query = new URLSearchParams({ page: String(page), limit: '2' });
    if (tag) query.set('tag', tag);
    const response = await ctx.app.request(`/?${query}`, { headers: admin ? headers : undefined }, ctx.env);
    expect(response.status).toBe(200);
    return await response.json() as { size: number; hasNext: boolean; data: { id: number; title: string; draft?: number }[] };
  }
  beforeEach(async () => {
    ctx = await setupTestApp(FeedService);
    await createTestUser(ctx.sqlite);
    await create('zh1', ['中文']);
    await create('en1', ['English']);
    await create('untagged', ['AI Native']);
    await create('both', ['中文', 'English']);
    await create('zh2', ['中文']);
    await create('en2', ['English']);
    await create('draft', ['中文', 'English'], { draft: true, listed: true });
    await create('unlisted', ['中文', 'English'], { draft: false, listed: false });
  });
  afterEach(() => cleanupTestDB(ctx.sqlite));

  it('filters in SQL before counting and slicing, including both tags only once', async () => {
    for (const [tag, expected] of [['中文', ['zh1', 'both', 'zh2']], ['English', ['en1', 'both', 'en2']]] as const) {
      const first = await list(tag);
      const second = await list(tag, 2);
      expect(first.size).toBe(3);
      expect(first.data).toHaveLength(2);
      expect(first.hasNext).toBe(true);
      expect(second.size).toBe(3);
      expect(second.hasNext).toBe(false);
      expect([...first.data, ...second.data].map(row => row.title).sort()).toEqual([...expected].sort());
      expect((await list(tag, 3)).data).toEqual([]);
      expect(await list(tag)).toEqual(first); // Cached page keeps the same order.
    }
    expect((await list()).size).toBe(6);
    expect(await list('missing')).toEqual({ size: 0, data: [], hasNext: false });
  });

  it('keeps normal homepage public for administrators and isolates cached variants', async () => {
    for (const tag of [undefined, '中文', 'English']) {
      const admin = await list(tag, 1, true); // Populate admin cache first.
      const anon = await list(tag);
      expect(anon.size).toBe(tag ? 3 : 6);
      expect(admin.data.map(row => row.id)).toEqual(anon.data.map(row => row.id));
      expect(anon.data.every(row => row.draft === undefined)).toBe(true);
      expect(admin.data.every(row => row.draft === 0)).toBe(true);
      const pages = await Promise.all([1, 2, 3].map(page => list(tag, page)));
      expect(pages.flatMap(page => page.data).some(row => ['draft', 'unlisted'].includes(row.title))).toBe(false);
    }
    for (const type of ['draft', 'unlisted']) {
      const response = await ctx.app.request(`/?type=${type}&tag=${encodeURIComponent('中文')}`, {}, ctx.env);
      expect(response.status).toBe(403);
    }
  });

  it('invalidates all tag/page variants when tags or publication visibility change', async () => {
    const id = await create('changed', ['中文']);
    expect((await list('中文')).size).toBe(4);
    expect((await list('English')).size).toBe(3);
    await list('中文', 2);
    await list(undefined, 1, true);
    const update = async (tags: string[], draft = false) => {
      const response = await ctx.app.request(`/${id}`, { method: 'POST', headers,
        body: JSON.stringify({ tags, draft, listed: true }),
      }, ctx.env);
      expect(response.status).toBe(200);
    };
    await update(['English']);
    expect((await list('中文')).size).toBe(3);
    expect((await list('中文', 2)).data).toHaveLength(1);
    expect((await list('English')).size).toBe(4);
    expect((await list()).size).toBe(7);
    await update(['English'], true);
    expect((await list('English')).size).toBe(3);
    expect((await list(undefined, 1, true)).size).toBe(6);
    const response = await ctx.app.request(`/${id}`, {}, ctx.env);
    expect(response.status).toBe(403);
  });
});
