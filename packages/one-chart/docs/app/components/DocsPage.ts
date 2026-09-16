import { Component, type VNode } from '@geektech/tsone';
import type {
  OneChartDocLocale,
  OneChartDocPage,
} from '../content';
import { localeHref, pick } from '../locale';
import { DocArticle } from './DocArticle';
import { DocsNav } from './DocsNav';
import { DocsToc } from './DocsToc';
import { LangSwitcher } from './LangSwitcher';

export interface DocsPageProps {
  page: OneChartDocPage;
  pages: OneChartDocPage[];
  locale: OneChartDocLocale;
}

const LANGUAGE_OPTIONS = [
  { value: 'zh', label: '\u4e2d\u6587' },
  { value: 'en', label: 'English' },
];

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
        className: 'one-chart-docs-shell',
        'data-one-chart-docs-page': page.path,
        'data-one-chart-docs-locale': locale,
      },
      children: [
        {
          tag: 'header',
          props: { className: 'one-chart-docs-topbar' },
          children: [
            {
              tag: 'a',
              props: {
                className: 'one-chart-docs-brand',
                href: localeHref('/', locale),
              },
              children: ['One Chart'],
            },
            {
              tag: 'div',
              props: { className: 'one-chart-docs-topbar-end' },
              children: [
                {
                  tag: 'nav',
                  props: {
                    className: 'one-chart-docs-topnav',
                    'aria-label': pick('顶部导航', 'Top navigation', locale),
                  },
                  children: [
                    {
                      tag: 'a',
                      props: { href: localeHref('/guide/getting-started/', locale) },
                      children: [pick('指南', 'Guide', locale)],
                    },
                    {
                      tag: 'a',
                      props: { href: localeHref('/charts/bar/', locale) },
                      children: [pick('图表', 'Charts', locale)],
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
                    className: 'one-chart-docs-lang',
                    'data-one-chart-lang': '',
                    'data-one-chart-lang-path': page.path,
                    'aria-label': pick('切换语言', 'Switch language', locale),
                  },
                  children: [
                    {
                      component: LangSwitcher,
                      props: {
                        path: page.path,
                        locale,
                        options: LANGUAGE_OPTIONS,
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          tag: 'div',
          props: { className: 'one-chart-docs-layout' },
          children: [
            {
              tag: 'aside',
              props: { className: 'one-chart-docs-sidebar' },
              children: [
                { component: DocsNav, props: { pages, currentPath: page.path, locale } },
              ],
            },
            {
              tag: 'main',
              props: { className: 'one-chart-docs-main' },
              children: [{ component: DocArticle, props: { page, locale } }],
            },
            {
              tag: 'aside',
              props: { className: 'one-chart-docs-toc' },
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
        className: 'one-chart-docs-theme',
        'data-one-chart-theme-toggle': '',
        'aria-label': pick('切换主题', 'Switch theme', locale),
      },
      children: [
        {
          tag: 'input',
          props: { type: 'checkbox', 'aria-label': pick('切换主题', 'Switch theme', locale) },
        },
        {
          tag: 'span',
          props: { className: 'one-chart-docs-theme-label' },
          children: [pick('主题', 'Theme', locale)],
        },
      ],
    };
  }
}
