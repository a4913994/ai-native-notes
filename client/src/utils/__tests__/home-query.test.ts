import { describe, expect, it } from 'bun:test';
import { homeLink, readHomeQuery } from '../home-query';

describe('Homepage URL state', () => {
  it('defaults to all posts and maps only the two explicit language tags', () => {
    expect(readHomeQuery('', 10)).toEqual({ articleLang: 'all', type: 'normal', page: 1, limit: 10, tag: undefined });
    expect(readHomeQuery('articleLang=zh', 10).tag).toBe('中文');
    expect(readHomeQuery('articleLang=en', 10).tag).toBe('English');
    expect(readHomeQuery('articleLang=ja', 10).tag).toBeUndefined();
  });
  it('resets page on filter changes and preserves filters during pagination or reload', () => {
    const filtered = homeLink('preview=1&page=4&limit=2', { articleLang: 'en', page: undefined });
    expect(readHomeQuery(filtered.split('?')[1], 10)).toMatchObject({ articleLang: 'en', page: 1, limit: 2 });
    const next = homeLink(filtered.split('?')[1], { page: 2 });
    expect(next).toContain('preview=1');
    expect(readHomeQuery(next.split('?')[1], 10)).toMatchObject({ tag: 'English', page: 2, limit: 2 });
  });
  it('normalizes malformed pagination without turning a query into a privileged list', () => {
    expect(readHomeQuery('page=-1&limit=0&type=unknown', 10)).toMatchObject({ page: 1, limit: 10, type: 'normal' });
    expect(readHomeQuery('page=1.5&limit=5000', 10)).toMatchObject({ page: 1, limit: 50 });
    expect(readHomeQuery('page=9007199254740992', 10).page).toBe(1);
  });
});
