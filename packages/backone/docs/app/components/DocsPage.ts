import { Component, type VNode } from '@geektech/tsone';
import type { BackOneDocLocale, BackOneDocPage } from '../content';
import { localeHref, pick } from '../locale';
import { DocArticle } from './DocArticle';
import { DocsNav } from './DocsNav';
import { DocsToc } from './DocsToc';
import { LangSwitcher } from './LangSwitcher';

export interface DocsPageProps {
  page: BackOneDocPage;
  pages: BackOneDocPage[];
  locale: BackOneDocLocale;
}

export class DocsPage extends Component<DocsPageProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    const { page, pages, locale } = this.props;

    return {
      tag: 'div',
      props: {
        className: 'backone-docs-shell',
        'data-backone-docs-page': page.path,
        'data-backone-docs-locale': locale,
      },
      children: [
        {
          tag: 'header',
          props: { className: 'backone-docs-topbar' },
          children: [
            {
              tag: 'a',
              props: {
                className: 'backone-docs-brand',
                href: localeHref('/', locale),
              },
              children: ['BackOne'],
            },
            {
              tag: 'div',
              props: { className: 'backone-docs-topbar-end' },
              children: [
                {
                  tag: 'nav',
                  props: {
                    className: 'backone-docs-topnav',
                    'aria-label': pick('顶部导航', 'Top navigation', locale),
                  },
                  children: [
                    {
                      tag: 'a',
                      props: { href: localeHref('/guide/routing/', locale) },
                      children: [pick('指南', 'Guide', locale)],
                    },
                    {
                      tag: 'a',
                      props: {
                        href: localeHref('/api/create-server/', locale),
                      },
                      children: [pick('API', 'API', locale)],
                    },
                    {
                      tag: 'a',
                      props: {
                        href: 'https://github.com/geektech-team/tsone',
                      },
                      children: ['GitHub'],
                    },
                  ],
                },
                this.renderThemeSwitcher(),
                {
                  tag: 'div',
                  props: {
                    className: 'backone-docs-lang',
                    'data-backone-lang-path': page.path,
                    'aria-label': pick('切换语言', 'Switch language', locale),
                  },
                  children: [
                    {
                      component: LangSwitcher,
                      props: { path: page.path, locale },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          tag: 'div',
          props: { className: 'backone-docs-layout' },
          children: [
            {
              tag: 'aside',
              props: { className: 'backone-docs-sidebar' },
              children: [
                {
                  component: DocsNav,
                  props: { pages, currentPath: page.path, locale },
                },
              ],
            },
            {
              tag: 'main',
              props: { className: 'backone-docs-main' },
              children: [{ component: DocArticle, props: { page, locale } }],
            },
            {
              tag: 'aside',
              props: { className: 'backone-docs-toc' },
              children: [{ component: DocsToc, props: { page, locale } }],
            },
          ],
        },
      ],
    };
  }

  private renderThemeSwitcher(): VNode {
    const { locale } = this.props;

    return {
      tag: 'label',
      props: {
        className: 'backone-docs-theme',
        'data-backone-theme-toggle': '',
        'aria-label': pick('切换主题', 'Switch theme', locale),
      },
      children: [
        {
          tag: 'input',
          props: {
            type: 'checkbox',
            className: 'backone-docs-theme-input',
            'aria-label': pick('切换主题', 'Switch theme', locale),
          },
        },
        {
          tag: 'span',
          props: {
            className: 'backone-docs-theme-track',
            'aria-hidden': 'true',
          },
        },
        {
          tag: 'span',
          props: { className: 'backone-docs-theme-label' },
          children: [pick('主题', 'Theme', locale)],
        },
      ],
    };
  }
}
