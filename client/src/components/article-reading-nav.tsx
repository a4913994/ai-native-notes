import {useEffect, useRef, useState, type RefObject} from 'react';
import {useTranslation} from 'react-i18next';
import {readingPosition} from '../utils/reading-position';
import './article-reading.css';

type Heading = {id: string; text: string; level: number; element: HTMLElement};

export function ArticleReadingNav({articleRef, contentKey}: {articleRef: RefObject<HTMLElement>; contentKey: string}) {
  const {t} = useTranslation();
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [{progress, active}, setPosition] = useState({progress: 0, active: -1});
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileToggle = useRef<HTMLButtonElement>(null);
  const desktopContents = useRef<HTMLDivElement>(null);

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
    const seen = new Set<string>();
    const items = Array.from(article.querySelectorAll<HTMLElement>('.toc-content :is(h1,h2,h3,h4,h5,h6)')).map((element, index) => {
      const text = element.textContent?.trim() || `${index + 1}`;
      let id = text;
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
    };
  }, [articleRef, contentKey]);

  function navigate(event: React.MouseEvent, heading: Heading, mobile = false) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (mobile) setMobileOpen(false);
    window.requestAnimationFrame(() => {
      const offset = (document.querySelector('.notebook-topbar')?.getBoundingClientRect().height || 64) + 24;
      heading.element.focus({preventScroll:true});
      window.history.replaceState(window.history.state, '', `#${encodeURIComponent(heading.id)}`);
      window.scrollTo({top: Math.max(0, heading.element.getBoundingClientRect().top + window.scrollY - offset), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
    });
  }
  const minLevel = Math.min(...headings.map(heading => heading.level));
  const list = (mobile = false) => <nav aria-label={t('reading.contents')}><ol>
    {headings.map((heading, index) => <li key={heading.id} style={{paddingInlineStart: Math.min(heading.level - minLevel, 3) * 12}}>
      <a href={`#${encodeURIComponent(heading.id)}`} aria-current={index === active ? 'location' : undefined} onClick={event => navigate(event, heading, mobile)}>{heading.text}</a>
    </li>)}
  </ol>{!headings.length && <p className="reading-empty">{t('reading.no_headings')}</p>}</nav>;
  const meter = <div className="reading-meter">
    <div className="reading-meter-label"><span>{t('reading.progress')}</span><span>{progress}%</span></div>
    <progress aria-label={t('reading.progress')} max={100} value={progress} />
  </div>;
  return <>
    <aside className={`reading-sidebar${hidden ? ' is-collapsed' : ''}`} aria-label={t('reading.navigation')}>
      <div className="reading-sidebar-heading"><h2>{t('reading.contents')}</h2><button type="button" aria-expanded={!hidden} aria-controls="reading-desktop-contents" onClick={() => setHidden(!hidden)}>{t(hidden ? 'reading.show' : 'reading.hide')}</button></div>
      <div ref={desktopContents} id="reading-desktop-contents" hidden={hidden}>{list()}</div>
      {meter}
    </aside>
    <div className="reading-mobile-contents" onKeyDown={event => {if (event.key === 'Escape' && mobileOpen) {setMobileOpen(false); mobileToggle.current?.focus();}}}>
      <button ref={mobileToggle} type="button" aria-expanded={mobileOpen} aria-controls="reading-mobile-contents" onClick={() => setMobileOpen(!mobileOpen)}>{t('reading.contents')} <span aria-hidden="true">{mobileOpen ? '−' : '+'}</span></button>
      <div id="reading-mobile-contents" hidden={!mobileOpen}>{list(true)}</div>
    </div>
    <div className="reading-mobile-progress">{meter}</div>
  </>;
}
