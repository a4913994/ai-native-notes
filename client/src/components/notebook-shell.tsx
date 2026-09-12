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
export { NotebookContext } from "./notebook-context";
import "./notebook.css";
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
  useEffect(() => { window.scrollTo(0, 0); }, [location]);
  const links = navigation || [['/', t('notebook.home')], ['/timeline', t('notebook.archive')], ['/hashtags', t('notebook.topics')], ['/friends', t('notebook.friends')]];
  const navigationLabel = t(admin ? 'admin.title' : 'notebook.navigation');
  return <NotebookContext.Provider value>
    <div className={`notebook-shell${admin ? ' notebook-admin' : ''}`}>
      <Helmet>
        <meta name="description" content={site.localizedDescription} />
        {config.getBoolean('rss') && <link rel="alternate" type="application/rss+xml" title={site.name} href="/rss.xml" />}
      </Helmet>
      <a className="notebook-skip" href="#notebook-content">{t('notebook.skip')}</a>
      <header className="notebook-topbar">
        <div className="notebook-topbar-inner">
          <div className="notebook-brand">{location === '/' ? <h1><Link href="/">{site.name}</Link></h1> : <Link href="/">{site.name}</Link>}</div>
          <div className="notebook-navigation">
            <nav className="notebook-desktop-nav" aria-label={navigationLabel}>
              {links.map(([href, label]) => <Link key={href} href={href} aria-current={location === href || (admin && location.startsWith(`${href}/`)) ? 'page' : undefined}>{label}</Link>)}
            </nav>
            <div className="notebook-mobile-nav"><ToolbarMenu label={navigationLabel} icon="ri-menu-line" items={links.map(([href,label]) => ({label,action:()=>navigate(href)}))}><span>{t('notebook.navigation_short')}</span></ToolbarMenu></div>
          </div>
          <SearchButton plain className="notebook-search" />
          <div className="notebook-controls">
            <InterfaceLanguageSwitch /><ThemeSwitch /><AccountMenu profile={profile} enabled={config.getBoolean('login.enabled')} />
          </div>
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
