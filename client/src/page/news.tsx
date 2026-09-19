import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import type { NewsDigest, NewsListResponse } from '@rin/api';
import { endpoint } from '../config';
import { Markdown } from '../components/markdown';
import { useSiteConfig } from '../hooks/useSiteConfig';
import './news.css';

export function NewsPage({ date }: { date?: string }) {
  const { t } = useTranslation();
  const site = useSiteConfig();
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [list, setList] = useState<NewsListResponse>({ data: [], hasNext: false });
  const [digest, setDigest] = useState<NewsDigest | null>(null);
  const [status, setStatus] = useState('loading');
  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading'); setDigest(null);
    async function get<T>(path: string): Promise<T> {
      const response = await fetch(`${endpoint}/api/news${path}`, { signal: controller.signal });
      if (!response.ok) throw new Error(response.status === 404 ? 'missing' : 'error');
      return response.json();
    }
    (async () => {
      const history = await get<NewsListResponse>(`?page=${page}`);
      setList(history);
      const selected = date || history.data[0]?.date;
      if (selected) setDigest(await get<NewsDigest>(`/${selected}`));
      setStatus('ready');
    })().catch(error => { if (!controller.signal.aborted) setStatus(error.message === 'missing' ? 'missing' : 'error'); });
    return () => controller.abort();
  }, [date, page, retry]);
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(new Date());
  const time = (value: string) => new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
  return <main className="news-page">
    <Helmet><title>{digest?.title || t('news.title')} · {site.name}</title><meta name="description" content={digest?.summary || t('news.intro')} /></Helmet>
    <header className="news-heading"><h1>{t('news.title')}</h1><p>{t('news.intro')}</p></header>
    {status === 'loading' && <p role="status">{t('notebook.loading')}</p>}
    {status === 'error' && <div role="alert"><p>{t('notebook.load_error')}</p><button className="notebook-link" onClick={() => setRetry(retry + 1)}>{t('reload')}</button></div>}
    {status === 'missing' && <p>{t('news.missing')} <Link href="/news">{t('news.latest')}</Link></p>}
    {status === 'ready' && !digest && <p>{t('news.empty')}</p>}
    {status === 'ready' && digest && <>
      {!date && page === 1 && digest.date !== today && <p className="news-notice">{t('news.pending', { date: digest.date })}</p>}
      <article>
        <header><h2>{digest.title}</h2><p className="news-meta">{t('news.generated')} · {time(digest.updatedAt)} UTC+8</p><p className="news-meta">{t('news.window')}：{time(digest.windowStart)} — {time(digest.windowEnd)}</p></header>
        {digest.sourceWarnings.length > 0 && <details className="news-notice"><summary>{t('news.partial')}</summary><ul>{digest.sourceWarnings.map(w => <li key={w}>{w}</li>)}</ul></details>}
        <div className="news-prose"><Markdown content={digest.content.replace(/^# [^\n]+\n+/, '')} untrusted /></div>
      </article>
    </>}
    {status === 'ready' && <nav className="news-history" aria-label={t('news.history')}><h2>{t('news.history')}</h2>
      <ul>{list.data.map(item => <li key={item.date}><Link href={`/news/${item.date}`} aria-current={item.date === digest?.date ? 'page' : undefined}>{item.title}</Link></li>)}</ul>
      <div className="news-pagination"><button disabled={page === 1} onClick={() => setPage(page - 1)}>{t('news.previous')}</button><span>{page}</span><button disabled={!list.hasNext} onClick={() => setPage(page + 1)}>{t('news.next')}</button></div>
      {date && <Link className="notebook-link" href="/news">{t('news.latest')}</Link>}
    </nav>}
  </main>;
}
