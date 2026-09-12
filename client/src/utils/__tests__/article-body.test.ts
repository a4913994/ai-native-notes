import { describe, expect, it } from 'bun:test';
import { articleBody } from '../article-body';

describe('Article reading title', () => {
  it('omits only an exact duplicate opening H1, including CRLF and closing hashes', () => {
    expect(articleBody('\r\n# 关于本站 ###\r\n\r\n正文', '关于本站')).toBe('正文');
    expect(articleBody('# Notes\n\nText\n\n# Notes', 'Notes')).toBe('Text\n\n# Notes');
  });
  it('preserves distinct headings, lower-level headings and code', () => {
    for (const content of ['# Other\nText', '## Notes\nText', '```md\n# Notes\n```', 'Introduction\n# Notes']) {
      expect(articleBody(content, 'Notes')).toBe(content);
    }
  });
});
