import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { useSiteConfig } from '../hooks/useSiteConfig';

export function SocialsPage() {
  const { t } = useTranslation();
  const site = useSiteConfig();
  return <main className="notebook-socials">
    <Helmet><title>{t('notebook.socials_title')} · {site.name}</title><meta name="description" content={t('notebook.socials_description')} /></Helmet>
    <h1>{t('notebook.socials_headline')}</h1>
    <p className="notebook-socials-intro">{t('notebook.socials_intro')}</p>
    <section className="notebook-social-primary" aria-labelledby="social-code">
      <i className="ri-github-line" aria-hidden="true" />
      <div><h2 id="social-code"><a className="notebook-link" href="https://github.com/a4913994">GitHub ↗</a></h2><p>@a4913994</p><p>{t('notebook.socials_code')}</p></div>
    </section>
    <section className="notebook-social-section" aria-labelledby="social-project">
      <h2 id="social-project">{t('notebook.socials_project')}</h2>
      <p>{t('notebook.socials_project_description')}</p>
      <a className="notebook-link" href="https://github.com/a4913994/ai-native-notes/tree/codex/ai-native-notes">ai-native-notes ↗</a>
    </section>
    <section className="notebook-social-section" aria-labelledby="social-follow">
      <h2 id="social-follow">{t('notebook.socials_follow')}</h2>
      <ul className="notebook-social-links">
        <li><Link className="notebook-link" href="/newsletter">{t('notebook.newsletter_title')} →</Link><p>{t('notebook.socials_subscribe')}</p></li>
        <li><Link className="notebook-link" href="/friends">{t('notebook.friends')} →</Link><p>{t('notebook.socials_friends')}</p></li>
      </ul>
    </section>
  </main>;
}
