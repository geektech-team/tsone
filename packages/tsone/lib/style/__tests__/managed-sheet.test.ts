import { expect, test } from 'bun:test';
import * as sheet from '../index';
import { renderHtmlDocument } from '../../core/document';

test('managed CSS preserves declaration and Map order, hover and media', () => {
  const styles = new Map<string, sheet.StyleOptions>();
  styles.set('a', {
    selector: '.a',
    properties: { fontSize: 12 },
    hover: { color: 'red' },
    media: { print: { display: 'none' } },
  });
  styles.set('b', { selector: '.b', properties: { color: 'blue' } });
  styles.set('b', { selector: '.b', properties: { color: 'green' } });
  expect(sheet.renderManagedStyleSheet(styles.values())).toBe(
    '.a {\nfont-size: 12;\n}\n.a:hover {\ncolor: red;\n}\n' +
      '@media print {\n.a {\ndisplay: none;\n}\n}\n' +
      '.b {\ncolor: green;\n}\n'
  );
  expect(sheet.renderManagedStyleSheet([])).toBe('');
});

test('only document.styles receives the extraction marker', () => {
  const html = renderHtmlDocument({
    title: 'Styles',
    body: [],
    head: [{ tag: 'style', text: '.user { color: red; }' }],
    styles: [{ selector: '.fixed', properties: { color: 'blue' } }],
  });
  expect(html).toContain('<style data-tsone-document-style>');
  expect(html).toContain('<style>.user { color: red; }</style>');
});
