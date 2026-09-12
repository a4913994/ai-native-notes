import { useContext } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { Link, useSearch } from 'wouter';
import { useSiteConfig } from '../hooks/useSiteConfig';
import { ProfileContext } from '../state/profile';
import { readHomeQuery, homeLink } from '../utils/home-query';
import { FeedCard, type FeedCardProps } from './feed_card';
import { ImageWithFallback } from './image-with-fallback';

export type HomeFeedData = { size: number; data: FeedCardProps[]; hasNext: boolean };
export function NotebookHome({ feeds, status, retry, preview = false }: { feeds: HomeFeedData; status: 'loading'|'ready'|'error'; retry?: () => void; preview?: boolean }) {
  const { t } = useTranslation();
  const site = useSiteConfig();
  const profile = useContext(ProfileContext);
  const search = useSearch();
  const { type, page, articleLang } = readHomeQuery(search,site.pageSize);
  return <main>
    <Helmet>
      <title>{site.name}</title>
      <meta name="description" content={site.localizedDescription} />
      <meta property="og:title" content={site.name} />
      <meta property="og:description" content={site.localizedDescription} />
      {preview && <meta name="robots" content="noindex" />}
    </Helmet>
    {type === 'normal' && page === 1 && <section className="notebook-intro" aria-label={t('notebook.about_site')}>
      <ImageWithFallback src={site.avatar || '/avatar.svg'} alt="" className="notebook-avatar" />
      <p>{site.localizedDescription}</p>
    </section>}
    <section aria-labelledby="notes-heading" aria-busy={status === 'loading'}>
      <div className="notebook-section-heading"><h2 id="notes-heading">{type === 'normal' ? t('notebook.recent') : t(type === 'draft' ? 'draft_bin' : 'unlisted')}</h2></div>
      <nav className="notebook-language-filter" aria-label={t('notebook.article_language')}>
        <span>{t('notebook.article_language')}</span>
        {(['all','zh','en'] as const).map(value => <Link key={value} href={homeLink(search,{articleLang:value,page:undefined})} aria-current={articleLang === value ? 'page' : undefined}>{value === 'all' ? t('notebook.all_languages') : value === 'zh' ? '中文' : 'English'}</Link>)}
      </nav>
      {preview && <p className="notebook-preview-label">{t('notebook.preview_label')} <Link href="/">{t('notebook.preview_exit')}</Link></p>}
      {profile?.permission && type !== 'normal' && <div className="notebook-manage"><Link className="notebook-link" href="/admin/writing">{t('writing')}</Link><Link className="notebook-link" href="/">{t('notebook.home')}</Link></div>}
      {status === 'loading' && <p className="notebook-status" role="status">{t('notebook.loading')}</p>}
      {status === 'error' && <div className="notebook-status" role="alert"><p>{t('notebook.load_error')}</p><button className="notebook-link" onClick={retry}>{t('reload')}</button></div>}
      {status === 'ready' && <>
        {feeds.data.map(feed => <FeedCard key={feed.id} {...feed} />)}
        {feeds.data.length === 0 && <div className="notebook-empty">
          <p>{articleLang === 'all' ? t('notebook.empty_body') : t('notebook.empty_language')}</p>
          {articleLang !== 'all' && <Link className="notebook-link" href={homeLink(search,{articleLang:'all',page:undefined})}>{t('notebook.show_all')}</Link>}
          {profile?.permission && articleLang === 'all' && <Link className="notebook-link" href="/admin/writing">{t('notebook.first_note')}</Link>}
          {import.meta.env.DEV && !preview && <p className="notebook-preview-label"><Link href="/?preview=1">{t('notebook.preview_open')}</Link></p>}
        </div>}
        {(page > 1 || feeds.hasNext) && <nav className="notebook-pagination" aria-label={t('notebook.pagination')}>
          {page > 1 ? <Link className="notebook-link" href={homeLink(search,{page:page-1})}>← {t('previous')}</Link> : <span />}
          {feeds.hasNext && <Link className="notebook-link" href={homeLink(search,{page:page+1})}>{t('next')} →</Link>}
        </nav>}
      </>}
    </section>
  </main>;
}
