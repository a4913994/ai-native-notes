import { useContext } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { Link, useSearch } from 'wouter';
import { useSiteConfig } from '../hooks/useSiteConfig';
import { ProfileContext } from '../state/profile';
import { readHomeQuery, homeLink } from '../utils/home-query';
import { FeedCard, type FeedCardProps } from './feed_card';

export type HomeFeedData = { size: number; data: FeedCardProps[]; hasNext: boolean };
export function NotebookHome({ feeds, status, retry }: { feeds: HomeFeedData; status: 'loading'|'ready'|'error'; retry?: () => void }) {
  const { t } = useTranslation();
  const site = useSiteConfig();
  const profile = useContext(ProfileContext);
  const search = useSearch();
  const { type, page } = readHomeQuery(search,site.pageSize);
  return <main>
    <Helmet>
      <title>{site.name}</title>
      <meta name="description" content={site.localizedDescription} />
      <meta property="og:title" content={site.name} />
      <meta property="og:description" content={site.localizedDescription} />
    </Helmet>
    <section aria-labelledby="notes-heading" aria-busy={status === 'loading'}>
      <div className="notebook-section-heading"><h2 id="notes-heading">{type === 'normal' ? t('notebook.recent') : t(type === 'draft' ? 'draft_bin' : 'unlisted')}</h2></div>
      {profile?.permission && type !== 'normal' && <div className="notebook-manage"><Link className="notebook-link" href="/admin/writing">{t('writing')}</Link><Link className="notebook-link" href="/">{t('notebook.home')}</Link></div>}
      {status === 'loading' && <p className="notebook-status" role="status">{t('notebook.loading')}</p>}
      {status === 'error' && <div className="notebook-status" role="alert"><p>{t('notebook.load_error')}</p><button className="notebook-link" onClick={retry}>{t('reload')}</button></div>}
      {status === 'ready' && <>
        {feeds.data.map(feed => <FeedCard key={feed.id} {...feed} />)}
        {feeds.data.length === 0 && <div className="notebook-empty">
          <p>{t('notebook.empty_body')}</p>
          {profile?.permission && <Link className="notebook-link" href="/admin/writing">{t('notebook.first_note')}</Link>}
        </div>}
        {(page > 1 || feeds.hasNext) && <nav className="notebook-pagination" aria-label={t('notebook.pagination')}>
          {page > 1 ? <Link className="notebook-link" href={homeLink(search,{page:page-1})}>← {t('previous')}</Link> : <span />}
          {feeds.hasNext && <Link className="notebook-link" href={homeLink(search,{page:page+1})}>{t('next')} →</Link>}
        </nav>}
      </>}
    </section>
  </main>;
}
