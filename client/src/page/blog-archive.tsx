import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { Link, useSearch } from 'wouter';
import { FeedCard } from '../components/feed_card';
import { usePublicPosts } from '../hooks/usePublicPosts';
import { useSiteConfig } from '../hooks/useSiteConfig';
import { archiveIndex } from '../utils/public-posts';

export function BlogArchivePage() {
  const { t } = useTranslation();
  const site = useSiteConfig();
  const { posts, status, retry } = usePublicPosts(true, 50);
  const tag = new URLSearchParams(useSearch()).get('tag') || '';
  const { tags, groups, count } = archiveIndex(posts, tag);
  return <main className="notebook-archive" aria-busy={status === 'loading'}>
    <Helmet><title>{t('notebook.archive_title')} · {site.name}</title><meta name="description" content={t('notebook.archive_description')} /></Helmet>
    <div className="notebook-archive-heading"><h1>{t('notebook.archive_title')}</h1>{status === 'ready' && <span>{t('article.total$count', { count })}</span>}</div>
    {status === 'loading' && <p role="status" className="notebook-status">{t('notebook.loading')}</p>}
    {status === 'error' && <div role="alert" className="notebook-status"><p>{t('notebook.load_error')}</p><button className="notebook-link" onClick={retry}>{t('reload')}</button></div>}
    {status === 'ready' && <>
      {groups.length > 0 && <nav className="notebook-year-jump" aria-label={t('notebook.jump_year')}><span>{t('notebook.jump_year')}</span>{groups.map(([year]) => <a key={year} href={`#year-${year}`}>{year === 'undated' ? t('notebook.undated') : year}</a>)}</nav>}
      <nav className="notebook-topic-filter" aria-label={t('notebook.browse_topics')}>
        <Link href="/blog" aria-current={!tag ? 'page' : undefined}>{t('notebook.all_posts')} <small>{posts.length}</small></Link>
        {tags.map(([name, total]) => <Link key={name} href={`/blog?tag=${encodeURIComponent(name)}`} aria-current={tag === name ? 'page' : undefined}>#{name} <small>{total}</small></Link>)}
      </nav>
      {count === 0 && <p className="notebook-empty">{t('notebook.empty_body')}</p>}
      {groups.map(([year, entries]) => <section key={year} id={`year-${year}`} className="notebook-year" aria-labelledby={`heading-${year}`}>
        <h2 id={`heading-${year}`}>{year === 'undated' ? t('notebook.undated') : year}<span>{t('article.total_short$count', { count: entries.length })}</span></h2>
        {entries.map(post => <FeedCard key={post.id} {...post} id={String(post.id)} title={post.title || ''} avatar={post.avatar || undefined} createdAt={new Date(post.createdAt)} updatedAt={new Date(post.updatedAt)} headingLevel={3} />)}
      </section>)}
      <div className="notebook-page-links"><Link className="notebook-link" href="/hashtags">{t('notebook.browse_topics')}</Link><Link className="notebook-link" href="/newsletter">{t('notebook.newsletter_title')}</Link></div>
    </>}
  </main>;
}
