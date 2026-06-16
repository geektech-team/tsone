import { describe, expect, it } from 'bun:test';
import {
  discoverDocs,
  renderMarkdownToHtml,
  resolveDocPath,
} from '../scripts/docs';

describe('Bun docs server helpers', () => {
  it('discovers markdown docs and resolves clean routes', async () => {
    const docs = await discoverDocs();

    expect(docs.some((doc) => doc.route === '/')).toBe(true);
    expect(docs.some((doc) => doc.route === '/guide/getting-started')).toBe(
      true
    );
    expect(resolveDocPath('/guide/getting-started', docs)?.filePath).toContain(
      'docs/src/guide/getting-started.md'
    );
  });

  it('renders basic markdown into safe html', () => {
    const html = renderMarkdownToHtml(
      [
        '# Title',
        '',
        'A [link](https://example.com) and `inline` code.',
        '',
        '```ts',
        'const count = 1;',
        '```',
      ].join('\n')
    );

    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<a href="https://example.com">link</a>');
    expect(html).toContain('<code>inline</code>');
    expect(html).toContain('<pre><code class="language-ts">');
  });
});
