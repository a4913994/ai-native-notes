import { useContext, useEffect, type ReactNode } from "react";
import { Helmet } from "react-helmet";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { useSiteConfig } from "../hooks/useSiteConfig";
import { ProfileContext } from "../state/profile";
import { ClientConfigContext } from "../state/config";
import { SearchButton } from "./site-header/primitives/action-buttons";
import { AccountMenu, InterfaceLanguageSwitch, ThemeSwitch, ToolbarMenu } from "./toolbar-controls";
import { NotebookContext } from "./notebook-context";
import { ImageWithFallback } from "./image-with-fallback";
export { NotebookContext } from "./notebook-context";
import "./notebook.css";
import "./notebook-pages.css";
import "@fontsource/ia-writer-mono/latin-400.css";

export function NotebookShell({ children, tools, navigation, admin = false }: {
  children: ReactNode;
  tools?: ReactNode;
  navigation?: [string, string][];
  admin?: boolean;
}) {
  const { t } = useTranslation();
  const site = useSiteConfig();
  const profile = useContext(ProfileContext);
  const config = useContext(ClientConfigContext);
  const [location, navigate] = useLocation();
  const homeTitle = location === '/';
  const section = location === '/newsletter' ? 'newsletter' : location === '/socials' ? 'socials' : ['/blog', '/timeline'].includes(location) ? 'archive' : undefined;
  const sectionTitle = section ? t(`notebook.${section}_masthead`) : site.name;
  const sectionDescription = section ? t(`notebook.${section}_description`) : site.localizedDescription;
  useEffect(() => { window.scrollTo(0, 0); }, [location]);
  const links = navigation || [
    ['/', t('notebook.nav_home')],
    ['/newsletter', t('notebook.nav_newsletter')],
    ['/blog', t('notebook.nav_blog')],
    ['https://github.com/a4913994', t('notebook.nav_github')],
    ['/socials', t('notebook.nav_socials')],
  ];
  const navigationLabel = t(admin ? 'admin.title' : 'notebook.navigation');
  return <NotebookContext.Provider value>
    <div className={`notebook-shell${admin ? ' notebook-admin' : ' notebook-public'}${homeTitle && !admin ? ' notebook-home' : ''}`}>
      <Helmet>
        <meta name="description" content={site.localizedDescription} />
        {config.getBoolean('rss') && <link rel="alternate" type="application/rss+xml" title={site.name} href="/rss.xml" />}
      </Helmet>
      <a className="notebook-skip" href="#notebook-content">{t('notebook.skip')}</a>
      {homeTitle && !admin && <div className="notebook-home-utilities">
        <SearchButton plain className="notebook-search" />
        <div className="notebook-controls">
          <InterfaceLanguageSwitch /><ThemeSwitch /><AccountMenu profile={profile} enabled={config.getBoolean('login.enabled')} />
        </div>
      </div>}
      {!admin && <div className={`notebook-masthead${section ? ' notebook-section-masthead' : ''}`}>
        <div className="notebook-identity">
          {homeTitle ? <h1 className="notebook-site-title">{site.name}</h1> : section ? <div className="notebook-site-title">{sectionTitle}</div> : <Link className="notebook-site-title" href="/">{site.name}</Link>}
          <p>{sectionDescription}</p>
        </div>
        <ImageWithFallback src={site.avatar || '/avatar.svg'} alt="" className="notebook-avatar" />
      </div>}
      <header className="notebook-topbar">
        <div className="notebook-topbar-inner">
          <div className="notebook-brand"><Link href="/">{site.name}</Link></div>
          <div className="notebook-navigation">
            <nav className="notebook-desktop-nav" aria-label={navigationLabel}>
              {links.map(([href, label]) => href.startsWith('https://')
                ? <a key={href} href={href}>{label}</a>
                : <Link key={href} href={href} aria-current={location === href || (href === '/blog' && (location === '/timeline' || location.startsWith('/feed/') || location.startsWith('/hashtag'))) || (admin && location.startsWith(`${href}/`)) ? 'page' : undefined}>{label}</Link>)}
            </nav>
            <div className="notebook-mobile-nav"><ToolbarMenu label={navigationLabel} icon="ri-menu-line" items={links.map(([href,label]) => ({label,action:()=>href.startsWith('https://') ? window.location.assign(href) : navigate(href)}))}><span>{t('notebook.navigation_short')}</span></ToolbarMenu></div>
          </div>
          {admin && <><SearchButton plain className="notebook-search" />
          <div className="notebook-controls">
            <InterfaceLanguageSwitch /><ThemeSwitch /><AccountMenu profile={profile} enabled={config.getBoolean('login.enabled')} />
          </div></>}
        </div>
      </header>
      <div className="notebook-wrap">
        {tools && <div className="notebook-article-tools">{tools}</div>}
        <div id="notebook-content" className="notebook-content" tabIndex={-1}>{children}</div>
        <footer className="notebook-footer">
          <span>© {new Date().getFullYear()} {site.name}</span>
          <nav aria-label={t('notebook.footer_links')}>
            <a href="https://github.com/a4913994/ai-native-notes/tree/codex/ai-native-notes">{t('notebook.source')}</a>
            <a href="https://github.com/a4913994">GitHub</a>
            {config.getBoolean('rss') && <a href="/rss.xml">RSS</a>}
          </nav>
        </footer>
      </div>
    </div>
  </NotebookContext.Provider>;
}
