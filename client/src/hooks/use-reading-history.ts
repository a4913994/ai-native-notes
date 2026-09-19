import { useLayoutEffect, useRef } from 'react';
import { useLocation, useSearch } from 'wouter';

type ReadingState = { y: number; open: number[]; article: boolean };
const positions = new Map<string, ReadingState>();

export function parseReadingState(raw: string | null): ReadingState | undefined {
  try {
    const value = JSON.parse(raw || 'null');
    if (!value || !Number.isFinite(value.y) || value.y < 0 || !Array.isArray(value.open) || value.open.some((index: unknown) => !Number.isInteger(index) || (index as number) < 0)) return;
    return { y: value.y, open: value.open, article: value.article === true };
  } catch { return; }
}

export function captureReadingState(): ReadingState {
  return { y: window.scrollY, article: Boolean(document.querySelector('#notebook-content .toc-content')), open: Array.from(document.querySelectorAll<HTMLDetailsElement>('#notebook-content details')).flatMap((element, index) => element.open ? [index] : []) };
}

export function useReadingHistory() {
  const [path] = useLocation();
  const search = useSearch();
  const pop = useRef(false);
  const previous = useRef<string>();
  useLayoutEffect(() => {
    const onPop = () => { pop.current = true; };
    const old = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    window.addEventListener('popstate', onPop);
    return () => { window.removeEventListener('popstate', onPop); window.history.scrollRestoration = old; };
  }, []);
  useLayoutEffect(() => {
    const key = path + window.location.search;
    let saved = positions.get(key);
    if (!saved) try { saved = parseReadingState(sessionStorage.getItem(`reading:${key}`)); } catch { /* Storage may be disabled. */ }
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const returning = pop.current || (!previous.current && navigation?.type !== 'navigate');
    let restoring = Boolean(returning && saved);
    if (previous.current && !pop.current) window.history.replaceState({ ...window.history.state, rinDepth: (window.history.state?.rinDepth || 0) + 1 }, '');
    previous.current = key;
    pop.current = false;
    let frame = 0;
    let lastWrite = 0;
    const persist = () => {
      if (restoring) return;
      const state = captureReadingState();
      positions.set(key, state);
      if (performance.now() - lastWrite > 250) {
        lastWrite = performance.now();
        try { sessionStorage.setItem(`reading:${key}`, JSON.stringify(state)); } catch { /* Optional restoration. */ }
      }
    };
    const stopRestore = () => { restoring = false; };
    const restore = () => {
      if (!restoring || !saved) return;
      if (saved.article && !document.querySelector('#notebook-content .toc-content')) return;
      document.querySelectorAll<HTMLDetailsElement>('#notebook-content details').forEach((element, index) => { element.open = saved!.open.includes(index); });
      window.scrollTo({ top: saved.y, behavior: 'instant' });
      if (document.documentElement.scrollHeight - window.innerHeight >= saved.y - 2) restoring = false;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; restore(); persist(); }); };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    const resize = new ResizeObserver(schedule);
    resize.observe(document.body);
    const saveOnHide = () => { lastWrite = 0; persist(); };
    window.addEventListener('scroll', schedule, { passive: true });
    document.addEventListener('toggle', schedule, true);
    window.addEventListener('pagehide', saveOnHide);
    window.addEventListener('wheel', stopRestore, { passive: true });
    window.addEventListener('touchstart', stopRestore, { passive: true });
    window.addEventListener('keydown', stopRestore);
    if (restoring) restore();
    else if (!window.location.hash) window.scrollTo({ top: 0, behavior: 'instant' });
    const timeout = window.setTimeout(stopRestore, 10000);
    return () => {
      observer.disconnect(); resize.disconnect(); cancelAnimationFrame(frame); clearTimeout(timeout);
      window.removeEventListener('scroll', schedule); document.removeEventListener('toggle', schedule, true);
      window.removeEventListener('pagehide', saveOnHide); window.removeEventListener('wheel', stopRestore);
      window.removeEventListener('touchstart', stopRestore); window.removeEventListener('keydown', stopRestore);
    };
  }, [path, search]);
}
