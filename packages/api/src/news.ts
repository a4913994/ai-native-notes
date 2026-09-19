export interface NewsInput {
  language: 'zh';
  title: string;
  summary: string;
  content: string;
  status: 'ready' | 'empty';
  windowStart: string;
  windowEnd: string;
  generatedAt: string;
  sourceWarnings: string[];
}
export interface NewsDigest extends NewsInput {
  date: string;
  publishedAt: string;
  updatedAt: string;
}
export type NewsListItem = Omit<NewsDigest, 'content'>;
export interface NewsListResponse { data: NewsListItem[]; hasNext: boolean }

export function validNewsDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function validateNewsInput(value: unknown): value is NewsInput {
  if (!value || typeof value !== 'object') return false;
  const v = value as NewsInput;
  return v.language === 'zh' && ['ready', 'empty'].includes(v.status)
    && typeof v.title === 'string' && v.title.length > 0 && v.title.length <= 200
    && typeof v.summary === 'string' && v.summary.length <= 2000
    && typeof v.content === 'string' && v.content.trim().length > 0 && v.content.length <= 500000
    && [v.windowStart, v.windowEnd, v.generatedAt].every(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}T.*Z$/.test(d) && Number.isFinite(Date.parse(d)))
    && Date.parse(v.windowStart) < Date.parse(v.windowEnd)
    && Date.parse(v.windowEnd) <= Date.parse(v.generatedAt)
    && Array.isArray(v.sourceWarnings) && v.sourceWarnings.length <= 100
    && v.sourceWarnings.every(w => typeof w === 'string' && w.length <= 300);
}
