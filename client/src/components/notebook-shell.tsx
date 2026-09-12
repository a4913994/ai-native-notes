import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { useSiteConfig } from "../hooks/useSiteConfig";
import { ProfileContext } from "../state/profile";
import Footer from "./footer";
import { ImageWithFallback } from "./image-with-fallback";
import { HeaderActions } from "./site-header/primitives/action-buttons";
import "./notebook.css";
import "@fontsource/ia-writer-mono/latin-400.css";
import "@fontsource/ia-writer-mono/latin-700.css";
import "@fontsource/ia-writer-mono/latin-400-italic.css";

export const NotebookContext = createContext(false);

export function NotebookShell({ children, tools }: { children: ReactNode; tools?: ReactNode }) {
  const { t } = useTranslation();
  const site = useSiteConfig();
  const profile = useContext(ProfileContext);
  const [location] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location]);
  const links = [
    ["/", t("notebook.home")],
    ["/timeline", t("notebook.archive")],
    ["/hashtags", t("notebook.topics")],
    ["/friends", t("notebook.friends")],
  ];
  return (
    <NotebookContext.Provider value>
      <div className="notebook-shell">
        <a className="notebook-skip" href="#notebook-content">{t("notebook.skip")}</a>
        <div className="notebook-wrap">
          <header className="notebook-header">
            <div className="notebook-identity">
              <div className="notebook-header-frame">
                <Link href="/" className="notebook-name">{site.name}</Link>
                <p className="notebook-subtitle">{t("notebook.subtitle")}</p>
              </div>
              <Link href="/" className="notebook-emblem" aria-label={site.name}>
                {site.avatar && site.avatar !== "/avatar.svg" ? <ImageWithFallback src={site.avatar} alt="" className="aspect-square w-full rounded-full" /> : <svg viewBox="0 0 120 120" aria-hidden="true">
                  <circle cx="60" cy="60" r="56" fill="var(--note-badge)" />
                  <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M33 31h48l7 7v51H33zM42 41h24M42 50h34M43 67l-6 6 6 6m30-12 6 6-6 6m-11-17-8 24" />
                    <path d="m84 24 2-7m7 13 7-2M23 76l-6 2" />
                  </g>
                  <circle cx="91" cy="83" r="7" fill="var(--note-pink)" />
                </svg>}
              </Link>
            </div>
          </header>
            <div className="notebook-nav-row">
              <nav className="notebook-nav" aria-label={t("notebook.navigation")}>
                {links.slice(0,3).map(([href, label]) => <Link key={href} href={href} aria-current={location === href ? "page" : undefined}>{label}</Link>)}
                <a href="https://github.com/a4913994" target="_blank" rel="noreferrer">github</a>
                <Link href="/friends" aria-current={location === "/friends" ? "page" : undefined}>{t("notebook.friends")}</Link>
              </nav>
            </div>
          {tools && <div className="notebook-article-tools">{tools}</div>}
          <div id="notebook-content" className="notebook-content" tabIndex={-1}>{children}</div>
          <div className="notebook-footer">
            <p>© {new Date().getFullYear()} {site.name}. <a className="notebook-link" href="https://github.com/a4913994/ai-native-notes">{t("notebook.source")}</a>! &lt;3</p>
            <div className="notebook-tools"><HeaderActions profile={profile} plain className="flex items-center gap-1" /></div>
            <Footer />
          </div>
        </div>
      </div>
    </NotebookContext.Provider>
  );
}
