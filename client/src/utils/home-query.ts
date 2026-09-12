export type ArticleLanguage = 'all' | 'zh' | 'en';
export type FeedListType = 'normal' | 'draft' | 'unlisted';
export function readHomeQuery(search: string, pageSize: number) {
  const query = new URLSearchParams(search);
  const value = query.get('articleLang');
  const articleLang: ArticleLanguage = value === 'zh' || value === 'en' ? value : 'all';
  const rawType = query.get('type');
  const type: FeedListType = rawType === 'draft' || rawType === 'unlisted' ? rawType : 'normal';
  const positive = (value: string | null, fallback: number) => /^\d+$/.test(value || '') && Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : fallback;
  return { articleLang, type, page: positive(query.get('page'),1), limit: Math.min(50,positive(query.get('limit'),pageSize)), tag: articleLang === 'zh' ? '中文' : articleLang === 'en' ? 'English' : undefined };
}
export function homeLink(search: string, changes: Record<string,string | number | undefined>) {
  const query = new URLSearchParams(search);
  for (const [key,value] of Object.entries(changes)) {
    if (value === undefined) query.delete(key);
    else query.set(key, String(value));
  }
  return query.size ? `/?${query.toString()}` : '/';
}
