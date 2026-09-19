import '../../test/setup';
import { useRef } from 'react';
import { afterEach, describe, expect, it } from 'bun:test';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { ArticleReadingNav } from '../article-reading-nav';

afterEach(cleanup);
describe('Reading navigation', () => {
  it('preserves existing news anchors and returns keyboard focus when contents close', () => {
    const previous = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
    const previousCancel = window.cancelAnimationFrame;
    window.cancelAnimationFrame = () => {};
    function Example() {
      const ref = useRef<HTMLElement>(null);
      return <><ArticleReadingNav articleRef={ref} contentKey="test" news /><article ref={ref}><div className="toc-content"><p><a id="item-featured-1" /></p><h3 id="generated-heading">First story</h3></div></article></>;
    }
    try {
      const { container } = render(<Example />);
      expect(container.querySelector('h3')?.id).toBe('item-featured-1');
      expect(container.querySelectorAll('#item-featured-1').length).toBe(1);
      const toggle = container.querySelector<HTMLButtonElement>('.reading-dock-contents')!;
      fireEvent.click(toggle);
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(document.activeElement?.closest('#reading-mobile-contents')).not.toBeNull();
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(toggle);
    } finally { cleanup(); globalThis.ResizeObserver = previous; window.cancelAnimationFrame = previousCancel; }
  });
});
