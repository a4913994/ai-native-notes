import {describe, expect, it} from 'bun:test';
import {readingPosition} from '../reading-position';

describe('Article reading position', () => {
  it('starts at zero before the article and excludes the page footer', () => {
    expect(readingPosition(280, 1400, 800, 100, [500, 1100])).toEqual({progress:0, active:-1});
    expect(readingPosition(-600, 1400, 800, 100, [-300, 300])).toEqual({progress:100, active:1});
  });
  it('keeps the current section active through long paragraphs without visible headings', () => {
    expect(readingPosition(-900, 3000, 800, 100, [-700, 600, 1600])).toEqual({progress:43, active:0});
  });
  it('returns to the earlier section when scrolling upward', () => {
    expect(readingPosition(-1400, 3000, 800, 100, [-1200, 100, 1100]).active).toBe(1);
    expect(readingPosition(-900, 3000, 800, 100, [-700, 600, 1600]).active).toBe(0);
  });
  it('handles short articles and articles without headings without NaN', () => {
    expect(readingPosition(500, 400, 800, 100, [])).toEqual({progress:0, active:-1});
    expect(readingPosition(300, 400, 800, 100, [])).toEqual({progress:100, active:-1});
  });
  it('recalculates progress after images or fonts increase article height', () => {
    expect(readingPosition(-600, 1400, 800, 100, []).progress).toBe(100);
    expect(readingPosition(-600, 2100, 800, 100, []).progress).toBe(50);
  });
});
