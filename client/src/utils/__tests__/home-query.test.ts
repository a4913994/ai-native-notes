import { describe, expect, it } from 'bun:test';
import { homeLink, readHomeQuery } from '../home-query';

describe('Homepage URL state', () => {
  it('uses the real feed and ignores retired preview and language parameters', () => {
    expect(readHomeQuery('', 10)).toEqual({ type: 'normal', page: 1, limit: 10 });
    for (const articleLang of ['zh', 'en', 'all']) {
      expect(readHomeQuery(`articleLang=${articleLang}&preview=1&sample=0`, 10)).toEqual(readHomeQuery('', 10));
    }
  });
  it('preserves pagination and list type while removing retired parameters from links', () => {
    const next = homeLink('type=draft&articleLang=en&preview=1&sample=0&limit=2&page=1', { page: 2 });
    expect(next).toBe('/?type=draft&limit=2&page=2');
    expect(readHomeQuery(next.split('?')[1], 10)).toEqual({ type: 'draft', page: 2, limit: 2 });
    expect(homeLink('articleLang=en&preview=1', {})).toBe('/');
  });
  it('normalizes malformed pagination without turning a query into a privileged list', () => {
    expect(readHomeQuery('page=-1&limit=0&type=unknown', 10)).toMatchObject({ page: 1, limit: 10, type: 'normal' });
    expect(readHomeQuery('page=1.5&limit=5000', 10)).toMatchObject({ page: 1, limit: 50 });
    expect(readHomeQuery('page=9007199254740992', 10).page).toBe(1);
  });
});
