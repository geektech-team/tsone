import { describe, expect, it } from 'bun:test';
import { createOneDocsPageApp } from '../docs/app/app';
import { oneDocPages } from '../docs/app/content';

function render(path: string): string {
  const page = oneDocPages.find((candidate) => candidate.path === path);
  if (!page) throw new Error(`Missing page: ${path}`);
  return createOneDocsPageApp(page, oneDocPages).renderHtmlDocument();
}

describe('One UI docs app', () => {
  it('creates a standalone document renderer instead of a runtime app', () => {
    const page = oneDocPages[0];
    const renderer = createOneDocsPageApp(page, oneDocPages);

    expect(Object.keys(renderer)).toEqual(['renderHtmlDocument']);
    expect('mount' in renderer).toBe(false);
  });

  it('renders the classic documentation shell and document metadata', () => {
    const html = render('/components/button/');
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('<html lang="zh-CN">');
    expect(html).toContain('<title>OneButton - One UI</title>');
    expect(html).toContain('data-one-docs-page="/components/button/"');
    expect(html).toContain('class="one-docs-topbar"');
    expect(html).toContain('class="one-docs-sidebar"');
    expect(html).toContain('class="one-docs-main"');
    expect(html).toContain('class="one-docs-toc"');
    expect(html).toContain('>One UI</a>');
    expect(html).toContain('>设计理念</a>');
    expect(html).toContain('>组件</a>');
    expect(html).toContain('>GitHub</a>');
    expect(html).toContain('/assets/one-docs-client.js');
  });

  it('renders ordered grouped navigation and marks the current page', () => {
    const html = render('/components/input/');
    const start = html.indexOf('>开始</h2>');
    const guide = html.indexOf('>指南</h2>');
    const components = html.indexOf('>组件</h2>');
    expect(start).toBeGreaterThan(-1);
    expect(guide).toBeGreaterThan(start);
    expect(components).toBeGreaterThan(guide);
    expect(html).toContain(
      'href="/components/input/" class="active" aria-current="page"'
    );
  });

  it('renders heading ids and an ordered right-hand table of contents', () => {
    const html = render('/components/card/');
    expect(html).toContain('<h1 id="card">OneCard</h1>');
    expect(html).toContain('<h2 id="slots">插槽与优先级</h2>');
    expect(html).toContain('href="#card"');
    expect(html).toContain('href="#slots"');
    expect(html.indexOf('href="#card"')).toBeLessThan(
      html.indexOf('href="#slots"')
    );
  });

  it('renders real static One component previews and hydration roots', () => {
    const button = render('/components/button/');
    expect(button).toContain('one-button one-button--primary one-button--md');
    expect(button).toContain('one-button one-button--danger one-button--lg');
    expect(button).toContain('data-one-demo="button"');

    const input = render('/components/input/');
    expect(input).toContain('one-input one-input--md');
    expect(input).toContain('data-one-demo="input"');

    const card = render('/components/card/');
    expect(card).toContain('class="one-card"');
    expect(card).toContain('class="one-card__header"');
    expect(card).toContain('class="one-card__footer"');
    expect(card).toContain('data-one-demo="card"');
  });

  it('ships component CSS and the classic responsive layout in the head', () => {
    const html = render('/components/button/');
    expect(html).toContain('.one-button {');
    expect(html).toContain('.one-input {');
    expect(html).toContain('.one-card {');
    expect(html).toContain('.one-docs-topbar {');
    expect(html).toContain('position: fixed;');
    expect(html).toContain('width: 240px;');
    expect(html).toContain('width: 180px;');
    expect(html).toContain('@media (max-width: 900px)');
    expect(html).toContain('grid-template-columns: minmax(0, 1fr);');
  });
});
