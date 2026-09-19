import {useEffect, useRef, useState, type RefObject} from 'react';
import {useTranslation} from 'react-i18next';
import {readingPosition} from '../utils/reading-position';
import './article-reading.css';

type Heading = {id: string; text: string; level: number; element: HTMLElement};

export function ArticleReadingNav({articleRef, contentKey, news = false}: {articleRef: RefObject<HTMLElement>; contentKey: string; news?: boolean}) {
  const {t} = useTranslation();
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [{progress, active}, setPosition] = useState({progress: 0, active: -1});
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [returnY, setReturnY] = useState<number | null>(null);
  const mobileToggle = useRef<HTMLButtonElement>(null);
  const desktopContents = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    document.querySelector<HTMLAnchorElement>('#reading-mobile-contents nav a')?.focus({ preventScroll: true });
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMobileOpen(false); mobileToggle.current?.focus(); }
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [mobileOpen]);

  useEffect(() => {
    const nav = desktopContents.current?.querySelector('nav');
    const link = nav?.querySelector('[aria-current]');
    if (!nav || !link || hidden) return;
    const bounds = nav.getBoundingClientRect();
    const current = link.getBoundingClientRect();
    if (current.bottom > bounds.bottom) nav.scrollTop += current.bottom - bounds.bottom;
    else if (current.top < bounds.top) nav.scrollTop -= bounds.top - current.top;
  }, [active, hidden]);

  useEffect(() => {
    const article = articleRef.current;
    if (!article) return;
    setPosition({progress: 0, active: -1});
    setMobileOpen(false);
    setReturnY(null);
    const seen = new Set<string>();
    const items = Array.from(article.querySelectorAll<HTMLElement>(news ? '.toc-content h3' : '.toc-content :is(h1,h2,h3,h4,h5,h6)')).map((element, index) => {
      const text = element.textContent?.trim() || `${index + 1}`;
      const oldAnchor = element.previousElementSibling?.querySelector<HTMLAnchorElement>('a[id]');
      let id = oldAnchor?.id || element.id || text;
      if (oldAnchor) oldAnchor.removeAttribute('id');
      for (let suffix = 2; seen.has(id); suffix++) id = `${text}-${suffix}`;
      seen.add(id);
      element.id = id;
      element.tabIndex = -1;
      return {id, text, level: Number(element.tagName.slice(1)), element};
    });
    setHeadings(items);
    let frame = 0;
    const update = () => {
      frame = 0;
      const offset = (document.querySelector('.notebook-topbar')?.getBoundingClientRect().height || 64) + 24;
      const rect = article.getBoundingClientRect();
      const next = readingPosition(rect.top, rect.height, window.innerHeight, offset, items.map(item => item.element.getBoundingClientRect().top));
      setPosition(old => old.progress === next.progress && old.active === next.active ? old : next);
    };
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    observer.observe(article);
    window.addEventListener('scroll', schedule, {passive:true});
    window.addEventListener('resize', schedule);
    update();
    const onInlineJump = (event: MouseEvent) => {
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      let id: string;
      try { id = decodeURIComponent(link.hash.slice(1)); } catch { return; }
      const heading = items.find(item => item.id === id);
      if (!heading) return;
      event.preventDefault();
      jump(heading);
    };
    article.addEventListener('click', onInlineJump);
    // Headings are rendered after data arrives; restore direct fragment links then.
    if (window.location.hash) {
      try {
        const item = items.find(item => item.id === decodeURIComponent(window.location.hash.slice(1)));
        if (item) item.element.scrollIntoView();
      } catch { /* Ignore malformed URL fragments. */ }
    }
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      article.removeEventListener('click', onInlineJump);
    };
  }, [articleRef, contentKey, news]);

  function jump(heading: Heading) {
    setReturnY(window.scrollY);
    setMobileOpen(false);
    window.requestAnimationFrame(() => {
      const offset = (document.querySelector('.notebook-topbar')?.getBoundingClientRect().height || 64) + 24;
      heading.element.focus({preventScroll:true});
      window.history.replaceState(window.history.state, '', `#${encodeURIComponent(heading.id)}`);
      window.scrollTo({top: Math.max(0, heading.element.getBoundingClientRect().top + window.scrollY - offset), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
    });
  }
  function navigate(event: React.MouseEvent, heading: Heading) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    jump(heading);
  }
  const minLevel = Math.min(...headings.map(heading => heading.level));
  const list = () => <nav aria-label={t('reading.contents')}><ol>
    {headings.map((heading, index) => <li key={heading.id} style={{paddingInlineStart: Math.min(heading.level - minLevel, 3) * 12}}>
      <a href={`#${encodeURIComponent(heading.id)}`} aria-current={index === active ? 'location' : undefined} onClick={event => navigate(event, heading)}>{heading.text.replace(/\s*⭐️?\s*[\d.?]+\/10$/, '')}</a>
    </li>)}
  </ol>{!headings.length && <p className="reading-empty">{t('reading.no_headings')}</p>}</nav>;
  const meter = <div className="reading-meter">
    <div className="reading-meter-label"><span>{t('reading.progress')}</span><span>{progress}%</span></div>
    <progress aria-label={t('reading.progress')} max={100} value={progress} />
  </div>;
  const actions = () => <div className="reading-actions">
    <button disabled={active <= 0} onClick={() => jump(headings[active - 1])} aria-label={t('reading.previous_section')}>← {t('reading.previous_short')}</button>
    <button disabled={!headings.length || active >= headings.length - 1} onClick={() => jump(headings[Math.max(0, active + 1)])} aria-label={t('reading.next_section')}>{t('reading.next_short')} →</button>
    <button onClick={() => {setReturnY(window.scrollY);if (mobileOpen) mobileToggle.current?.focus({preventScroll:true});setMobileOpen(false);window.scrollTo({top:0, behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});}}>{t('reading.top')}</button>
    {returnY !== null && <button onClick={() => {window.scrollTo({top:returnY, behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});setReturnY(null);if (mobileOpen) mobileToggle.current?.focus({preventScroll:true});setMobileOpen(false);}}>{t('reading.return_position')}</button>}
  </div>;
  return <>
    <aside className={`reading-sidebar${hidden ? ' is-collapsed' : ''}`} aria-label={t('reading.navigation')}>
      <div className="reading-sidebar-heading"><h2>{t('reading.contents')}</h2><button type="button" aria-expanded={!hidden} aria-controls="reading-desktop-contents" onClick={() => setHidden(!hidden)}>{t(hidden ? 'reading.show' : 'reading.hide')}</button></div>
      <div ref={desktopContents} id="reading-desktop-contents" hidden={hidden}>{list()}</div>
      {meter}
      {actions()}
    </aside>
    <div className={`reading-mobile-contents${mobileOpen ? ' is-open' : ''}`}>
      <div id="reading-mobile-contents" hidden={!mobileOpen}><div className="reading-panel-heading"><strong>{t('reading.contents')}</strong><button onClick={() => {setMobileOpen(false); mobileToggle.current?.focus();}} aria-label={t('reading.close')}>×</button></div>{list()}{actions()}</div>
    </div>
    <div className="reading-dock" aria-label={t('reading.navigation')}>
      <button ref={mobileToggle} className="reading-dock-contents" aria-label={t('reading.contents')} aria-expanded={mobileOpen} aria-controls="reading-mobile-contents" onClick={() => setMobileOpen(!mobileOpen)}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6h16M4 12h16M4 18h10" /></svg></button>
    </div>
  </>;
}
