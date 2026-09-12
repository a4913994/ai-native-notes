import { useContext, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { usePublicPosts } from '../hooks/usePublicPosts';
import { useSiteConfig } from '../hooks/useSiteConfig';
import { ClientConfigContext } from '../state/config';

export function NewsletterPage() {
  const { t, i18n } = useTranslation();
  const site = useSiteConfig();
  const config = useContext(ClientConfigContext);
  const enabled = config.getBoolean('rss');
  const { posts, status, retry } = usePublicPosts();
  const address = new URL('/rss.xml', window.location.href).href;
  const input = useRef<HTMLInputElement>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'manual'>('idle');
  async function copy() {
    try { await navigator.clipboard.writeText(address); setCopyState('copied'); }
    catch { input.current?.focus(); input.current?.select(); setCopyState('manual'); }
  }
  return <main className="notebook-newsletter">
    <Helmet><title>{t('notebook.newsletter_title')} · {site.name}</title><meta name="description" content={t('notebook.newsletter_description')} /></Helmet>
    <div className="notebook-newsletter-lead"><h1>{t('notebook.newsletter_headline')}</h1><p>{t('notebook.newsletter_intro')}</p><a className="notebook-link" href="#subscribe">{t('notebook.newsletter_start')} ↓</a></div>
    <section className="notebook-newsletter-topics" aria-labelledby="newsletter-topics">
      <h2 id="newsletter-topics">{t('notebook.newsletter_topics')}</h2>
      {(['ai', 'engineering', 'projects'] as const).map((topic, index) => <div className="notebook-topic-note" key={topic}><span aria-hidden="true">0{index + 1}</span><div><h3>{t(`notebook.topic_${topic}`)}</h3><p>{t(`notebook.topic_${topic}_description`)}</p></div></div>)}
    </section>
    <section id="subscribe" className="notebook-subscribe-box" aria-labelledby="subscribe-heading">
      <h2 id="subscribe-heading">{t('notebook.newsletter_start')}</h2>
      {enabled ? <>
        <p>{t('notebook.newsletter_instructions')}</p>
        <label htmlFor="rss-address">{t('notebook.rss_address')}</label>
        <div className="notebook-copy-address"><input ref={input} id="rss-address" readOnly value={address} onFocus={event => event.target.select()} /><button type="button" onClick={copy}>{t('notebook.copy_address')}</button></div>
        <p className="notebook-copy-status" role="status">{copyState === 'copied' ? t('notebook.copied') : copyState === 'manual' ? t('notebook.copy_manually') : ''}</p>
        <div className="notebook-page-links"><a className="notebook-link" href="/rss.xml">{t('notebook.newsletter_rss')}</a><Link className="notebook-link" href="/blog">{t('notebook.archive_title')}</Link></div>
        <p className="notebook-subscribe-note">{t('notebook.email_pending')}</p>
      </> : <p>{t('notebook.newsletter_unavailable')}</p>}
    </section>
    <section className="notebook-newsletter-reading" aria-labelledby="newsletter-reading">
      <h2 id="newsletter-reading">{t('notebook.read_first')}</h2>
      {status === 'loading' && <p role="status">{t('notebook.loading')}</p>}
      {status === 'error' && <div role="alert"><p>{t('notebook.load_error')}</p><button className="notebook-link" onClick={retry}>{t('reload')}</button></div>}
      {status === 'ready' && (posts.length ? <ul>{posts.map(post => <li key={post.id}><Link className="notebook-link" href={`/feed/${post.id}`}>{post.title || t('notebook.untitled')}</Link><time dateTime={post.createdAt}>{new Date(post.createdAt).toLocaleDateString(i18n.resolvedLanguage, {year:'numeric',month:'short',day:'numeric'})}</time></li>)}</ul> : <p>{t('notebook.empty_body')}</p>)}
    </section>
  </main>;
}
