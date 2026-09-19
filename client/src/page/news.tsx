import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import type { NewsDigest, NewsListResponse } from '@rin/api';
import { loadNews } from '../api/news';
import { Markdown } from '../components/markdown';
import { useSiteConfig } from '../hooks/useSiteConfig';
import { prepareNewsMarkdown } from '../utils/news-markdown';
import './news.css';
import { ArticleReadingNav } from '../components/article-reading-nav';
import { ReadingBack } from '../components/reading-back';

export function NewsPage({ date }: { date?: string }) {
  const { t } = useTranslation();
  const site = useSiteConfig();
  const articleRef = useRef<HTMLElement>(null);
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [list, setList] = useState<NewsListResponse>({ data: [], hasNext: false });
  const [digest, setDigest] = useState<NewsDigest | null>(null);
  const [status, setStatus] = useState('loading');
  const [historyError, setHistoryError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setHistoryError(false);
    loadNews<NewsListResponse>(`?page=${page}`, retry > 0).then(history => {if (!cancelled) setList(history);}).catch(() => {if (!cancelled) setHistoryError(true);});
    return () => { cancelled = true; };
  }, [page, retry]);
  useEffect(() => {
    let cancelled = false;
    setStatus('loading'); setDigest(null);
    (async () => {
      const selected = date || (await loadNews<NewsListResponse>('?page=1', retry > 0)).data[0]?.date;
      const result = selected ? await loadNews<NewsDigest>(`/${selected}`, retry > 0) : null;
      if (!cancelled) { setDigest(result); setStatus('ready'); }
    })().catch(error => { if (!cancelled) setStatus(error.message === 'missing' ? 'missing' : 'error'); });
    return () => { cancelled = true; };
  }, [date, retry]);
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(new Date());
  const time = (value: string) => new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
  return <main className="news-page notebook-article-layout">
    <ReadingBack fallback={date ? '/news' : '/'} label={t(date ? 'news.latest' : 'notebook.nav_home')} />
    <Helmet><title>{digest?.title || t('news.title')} · {site.name}</title><meta name="description" content={digest?.summary || t('news.intro')} /></Helmet>
    <header className="news-heading"><h1>{t('news.title')}</h1><p>{t('news.intro')}</p></header>
    {status === 'loading' && <p role="status">{t('notebook.loading')}</p>}
    {status === 'error' && <div role="alert"><p>{t('notebook.load_error')}</p><button className="notebook-link" onClick={() => setRetry(retry + 1)}>{t('reload')}</button></div>}
    {status === 'missing' && <p>{t('news.missing')} <Link href="/news">{t('news.latest')}</Link></p>}
    {status === 'ready' && !digest && <p>{t('news.empty')}</p>}
    {status === 'ready' && digest && <>
      <ArticleReadingNav key={digest.date} articleRef={articleRef} contentKey={`${digest.date}:${digest.updatedAt}`} news />
      {!date && digest.date !== today && <p className="news-notice">{t('news.pending', { date: digest.date })}</p>}
      <article ref={articleRef}>
        <header><h2>{digest.title}</h2><p className="news-meta">{t('news.generated')} · {time(digest.updatedAt)} UTC+8</p><p className="news-meta">{t('news.window')}：{time(digest.windowStart)} — {time(digest.windowEnd)}</p></header>
        {digest.sourceWarnings.length > 0 && <details className="news-notice"><summary>{t('news.partial')}</summary><ul>{digest.sourceWarnings.map(w => <li key={w}>{w}</li>)}</ul></details>}
        <p className="news-meta">{t('reading.external_hint')}</p>
        <div className="news-prose"><Markdown content={prepareNewsMarkdown(digest.content)} untrusted /></div>
      </article>
    </>}
    {status === 'ready' && <nav className="news-history" aria-label={t('news.history')}><h2>{t('news.history')}</h2>
      {historyError && <p role="alert">{t('notebook.load_error')} <button onClick={() => setRetry(retry + 1)}>{t('reload')}</button></p>}
      <ul>{list.data.map(item => <li key={item.date}><Link href={`/news/${item.date}`} aria-current={item.date === digest?.date ? 'page' : undefined}>{item.title}</Link></li>)}</ul>
      <div className="news-pagination"><button disabled={page === 1} onClick={() => setPage(page - 1)}>{t('news.previous')}</button><span>{page}</span><button disabled={!list.hasNext} onClick={() => setPage(page + 1)}>{t('news.next')}</button></div>
      {date && <Link className="notebook-link" href="/news">{t('news.latest')}</Link>}
    </nav>}
  </main>;
}
