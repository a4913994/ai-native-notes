import '../../test/setup';
import { describe, expect, it } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { newsMarkdownSchema } from '../news-markdown-schema';

describe('Untrusted news Markdown', () => {
  it('preserves Horizon anchors and references while dropping active HTML', () => {
    const html = renderToStaticMarkup(<ReactMarkdown rehypePlugins={[rehypeRaw, [rehypeSanitize, newsMarkdownSchema]]}>{'<a id="item-tech-news-1"></a>\n\n[目录](#item-tech-news-1)\n\n<details><summary>参考链接</summary><a href="https://example.com">来源</a></details>\n\n<script>alert(1)</script><iframe src="https://evil.test"></iframe><img src="x" onerror="alert(1)"><a id="location" name="location" href="javascript:alert(1)">bad</a>'}</ReactMarkdown>);
    expect(html).toContain('id="item-tech-news-1"');
    expect(html).toContain('href="#item-tech-news-1"');
    expect(html).toContain('<details><summary>参考链接</summary>');
    expect(html).toContain('href="https://example.com"');
    for (const unsafe of ['<script', '<iframe', 'onerror', 'javascript:', 'id="location"', 'name="location"']) expect(html).not.toContain(unsafe);
  });
});
