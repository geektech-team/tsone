import { describe, expect, it } from 'bun:test';
import type { AppDocumentRenderOptions } from '@geektech/tsone';
import { createOneDocsPageApp } from '../docs/app/app';
import { oneDocPages } from '../docs/app/content';

function render(
  path: string,
  options?: AppDocumentRenderOptions
): string {
  const page = oneDocPages.find((candidate) => candidate.path === path);
  if (!page) throw new Error(`Missing page: ${path}`);
  return createOneDocsPageApp(page, oneDocPages).renderHtmlDocument(options);
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
    expect(html).toContain('<html lang="zh-CN" data-one-theme="default">');
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
    // 客户端 bundle 的 script 由 tsone-cli 构建时注入，SSR 骨架不自带。
    expect(html).not.toContain('<script type="module"');
  });

  it('merges CLI-injected head and scripts into the rendered document', () => {
    const html = render('/components/button/', {
      head: [
        {
          tag: 'link',
          attributes: { rel: 'stylesheet', href: '/assets/one-docs.css' },
        },
      ],
      scripts: [{ type: 'module', src: '/assets/one-docs-client.js' }],
    });
    expect(html).toContain(
      '<link rel="stylesheet" href="/assets/one-docs.css">'
    );
    expect(html).toContain(
      '<script type="module" src="/assets/one-docs-client.js">'
    );
  });

  it('renders a default theme switch and a no-flash bootstrap script', () => {
    const html = render('/components/button/');
    expect(html).toContain('class="one-docs-theme"');
    expect(html).toContain('data-one-theme-toggle=""');
    expect(html).toContain('class="one-switch"');
    expect(html).toContain('class="one-switch__input"');
    expect(html).toContain('class="one-switch__thumb"');
    expect(html).toContain('aria-label="切换主题"');
    expect(html).toContain('class="one-docs-theme-label">主题</span>');
    expect(html).toContain('data-one-theme="dark"');
    expect(html).toContain('localStorage.getItem');
    expect(html).toContain("'one-docs-theme'");
    expect(html.indexOf('localStorage.getItem')).toBeLessThan(
      html.indexOf('</head>')
    );
    expect(html.indexOf('localStorage.getItem')).toBeLessThan(
      html.indexOf('<body>')
    );
  });

  it('renders ordered grouped navigation and marks the current page', () => {
    const html = render('/components/form/input/');
    const start = html.indexOf('>开始</h2>');
    const guide = html.indexOf('>指南</h2>');
    const components = html.indexOf('>组件</h2>');
    expect(start).toBeGreaterThan(-1);
    expect(guide).toBeGreaterThan(start);
    expect(components).toBeGreaterThan(guide);
    expect(html).toContain(
      'href="/zh/components/form/input/" class="active" aria-current="page"'
    );
  });

  it('renders unclassified components in a 通用分类 and keeps hierarchy with categories', () => {
    const html = render('/components/data-display/tag/');

    expect(html).toContain('>Button</a>');
    expect(html).toContain('>通用</li>');
    expect(html).toContain('>表单组件</li>');
    expect(html).toContain('>数据展示</li>');
    expect(html).toContain(
      'class="one-docs-nav-item one-docs-nav-item--category one-docs-nav-item--category-label"'
    );
    expect(html).toContain(
      'class="one-docs-nav-section one-docs-nav-section--components"'
    );
    expect(html).toContain(
      'class="one-docs-nav-item one-docs-nav-item--category one-docs-nav-item--category-label">'
    );
    expect(html).toContain(
      'class="one-docs-nav-item one-docs-nav-item--component one-docs-nav-item--leaf"'
    );
    expect(html).not.toContain('>OneButton</a>');
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

  it('associates API columns and distinguishes Card props from slots', () => {
    const card = render('/components/card/');
    expect(card).toContain('<caption>OneCard 属性</caption>');
    expect(card).toContain('<caption>OneCard 插槽</caption>');
    expect(card).toContain('<th scope="col">名称</th>');
    expect(card).toContain('<th scope="col">签名</th>');
    expect(card).toContain('<th scope="col">说明</th>');
  });

  it('renders real static One component previews and hydration roots', () => {
    const button = render('/components/button/');
    expect(button).toContain('one-button one-button--primary one-button--md');
    expect(button).toContain('one-button one-button--danger one-button--lg');
    expect(button).toContain('data-one-demo="button"');

    const input = render('/components/form/input/');
    expect(input).toContain('one-input one-input--md');
    expect(input).toContain('data-one-demo="input"');

    const card = render('/components/card/');
    expect(card).toContain('class="one-card"');
    expect(card).toContain('class="one-card__header"');
    expect(card).toContain('class="one-card__footer"');
    expect(card).toContain('data-one-demo="card"');

    for (const [path, preview, demo] of [
      ['/components/data-display/tag/', 'class="one-tag ', 'tag'],
      [
        '/components/data-display/badge/',
        'class="one-badge__content"',
        'badge',
      ],
      ['/components/data-display/empty/', 'class="one-empty"', 'empty'],
      ['/components/data-display/avatar/', 'class="one-avatar ', 'avatar'],
      ['/components/data-display/progress/', 'class="one-progress"', 'progress'],
      ['/components/form/radio/', 'class="one-radio-group"', 'radio'],
      [
        '/components/form/time-picker/',
        'class="one-time-picker',
        'time-picker',
      ],
      ['/components/feedback/alert/', 'class="one-alert ', 'alert'],
      ['/components/feedback/message/', 'class="one-message ', 'message'],
      ['/components/feedback/dialog/', 'class="one-dialog"', 'dialog'],
      ['/components/feedback/loading/', 'class="one-loading ', 'loading'],
      [
        '/components/feedback/tooltip/',
        'class="one-tooltip__bubble"',
        'tooltip',
      ],
      ['/components/navigation/tabs/', 'class="one-tabs"', 'tabs'],
      [
        '/components/navigation/breadcrumb/',
        'class="one-breadcrumb"',
        'breadcrumb',
      ],
      [
        '/components/navigation/pagination/',
        'class="one-pagination"',
        'pagination',
      ],
      ['/components/form/slider/', 'class="one-slider"', 'slider'],
      ['/components/form/rate/', 'class="one-rate', 'rate'],
      ['/components/form/upload/', 'class="one-upload', 'upload'],
      ['/components/data-display/table/', 'class="one-table__wrap"', 'table'],
      ['/components/data-display/collapse/', 'class="one-collapse"', 'collapse'],
      ['/components/data-display/skeleton/', 'class="one-skeleton', 'skeleton'],
    ] as const) {
      const html = render(path);
      expect(html).toContain(preview);
      expect(html).toContain(`data-one-demo="${demo}"`);
      expect(html).toContain(`data-one-demo-source="${demo}"`);
    }
  });

  it('renders demo source in a collapsed native disclosure', () => {
    const button = render('/components/button/');

    expect(button).toContain(
      '<details class="one-docs-demo-source" data-one-demo-source="button">'
    );
    expect(button).not.toContain(
      '<details class="one-docs-demo-source" data-one-demo-source="button" open'
    );
    expect(button).toContain(
      '<span class="one-docs-demo-source__show">查看代码</span>'
    );
    expect(button).toContain(
      '<span class="one-docs-demo-source__hide">收起代码</span>'
    );
    expect(button).toContain('<code class="language-ts">');
    expect(button).toContain('createComponent(OneButton');
  });

  it('escapes demo source before inserting it into the document', () => {
    const form = render('/components/form/form/');

    expect(form).toContain('value.length &lt; 3');
    expect(form).not.toContain('value.length < 3');
  });

  it('ships component CSS and the classic responsive layout in the head', () => {
    const html = render('/components/button/');
    expect(html).toContain('.one-button {');
    expect(html).toContain('.one-input {');
    expect(html).toContain('.one-card {');
    expect(html).toContain('.one-radio {');
    expect(html).toContain('.one-time-picker {');
    expect(html).toContain('.one-avatar {');
    expect(html).toContain('.one-progress {');
    expect(html).toContain('.one-loading {');
    expect(html).toContain('.one-alert {');
    expect(html).toContain('.one-message {');
    expect(html).toContain('.one-dialog {');
    expect(html).toContain('.one-tooltip__bubble {');
    expect(html).toContain('.one-slider {');
    expect(html).toContain('.one-rate {');
    expect(html).toContain('.one-upload {');
    expect(html).toContain('.one-table {');
    expect(html).toContain('.one-collapse {');
    expect(html).toContain('.one-skeleton {');
    expect(html).toContain('.one-docs-topbar {');
    expect(html).toContain('position: fixed;');
    expect(html).toContain('width: 240px;');
    expect(html).toContain('width: 180px;');
    expect(html).toContain('@media (max-width: 900px)');
    expect(html).toContain('grid-template-columns: minmax(0, 1fr);');
  });

  it('adds shared padding to every interactive demo root', () => {
    const html = render('/components/button/');
    const demoRootStyles = html.match(/\[data-one-demo\] \{[^}]+\}/)?.[0];
    const feedbackStackStyles = html.match(
      /\.one-docs-feedback-stack \{[^}]+\}/
    )?.[0];
    const feedbackActionStyles = html.match(
      /\.one-docs-feedback-actions,[^{]+\{[^}]+\}/
    )?.[0];
    const tooltipStyles = html.match(/\.one-docs-tooltip-demo \{[^}]+\}/)?.[0];

    expect(demoRootStyles).toContain('box-sizing: border-box;');
    expect(demoRootStyles).toContain('padding: 24px;');
    expect(feedbackStackStyles).not.toContain('padding: 24px;');
    expect(feedbackActionStyles).not.toContain('padding: 24px;');
    expect(tooltipStyles).not.toContain('padding: 24px;');
  });
});
