import '../../test/setup';
import { describe, expect, it } from 'bun:test';
import { captureReadingState, parseReadingState } from '../use-reading-history';

describe('Reading history', () => {
  it('rejects corrupt stored positions instead of breaking page navigation', () => {
    for (const raw of [null, '{', '{}', '{"y":-1,"open":[]}', '{"y":1,"open":["x"]}']) expect(parseReadingState(raw)).toBeUndefined();
    expect(parseReadingState('{"y":1200,"open":[0,3],"article":true}')).toEqual({ y: 1200, open: [0,3], article: true });
  });
  it('preserves article disclosure state without capturing unrelated page controls', () => {
    const container = document.createElement('div');
    container.innerHTML = '<details open></details><main id="notebook-content"><div class="toc-content"></div><details></details><details open></details></main>';
    document.body.appendChild(container);
    try { expect(captureReadingState()).toEqual({ y: window.scrollY, open: [1], article: true }); }
    finally { container.remove(); }
  });
});
