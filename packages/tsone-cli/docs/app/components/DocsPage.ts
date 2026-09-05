import { Component, type VNode } from '@geektech/tsone';
import type { CliDocLocale, CliDocPage } from '../content';
import { localeHref, pick } from '../locale';
import { DocArticle } from './DocArticle';
import { DocsNav } from './DocsNav';
import { DocsToc } from './DocsToc';

export interface DocsPageProps {
  page: CliDocPage;
  pages: CliDocPage[];
  locale: CliDocLocale;
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
        className: 'cli-docs-shell',
        'data-cli-docs-page': page.path,
        'data-cli-docs-locale': locale,
      },
      children: [
        {
          tag: 'header',
          props: { className: 'cli-docs-topbar' },
          children: [
            {
              tag: 'a',
              props: {
                className: 'cli-docs-brand',
                href: localeHref('/', locale),
              },
              children: ['TSone CLI'],
            },
            {
              tag: 'div',
              props: { className: 'cli-docs-topbar-end' },
              children: [
                {
                  tag: 'nav',
                  props: {
                    className: 'cli-docs-topnav',
                    'aria-label': pick('顶部导航', 'Top navigation', locale),
                  },
                  children: [
                    {
                      tag: 'a',
                      props: { href: localeHref('/getting-started/', locale) },
                      children: [pick('快速开始', 'Getting started', locale)],
                    },
                    {
                      tag: 'a',
                      props: { href: localeHref('/commands/', locale) },
                      children: [pick('命令', 'Commands', locale)],
                    },
                    {
                      tag: 'a',
                      props: { href: localeHref('/config/', locale) },
                      children: [pick('配置', 'Config', locale)],
                    },
                    {
                      tag: 'a',
                      props: { href: localeHref('/api/', locale) },
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
                this.renderLanguageSwitcher(),
              ],
            },
          ],
        },
        {
          tag: 'div',
          props: { className: 'cli-docs-layout' },
          children: [
            {
              tag: 'aside',
              props: { className: 'cli-docs-sidebar' },
              children: [
                {
                  component: DocsNav,
                  props: { pages, currentPath: page.path, locale },
                },
              ],
            },
            {
              tag: 'main',
              props: { className: 'cli-docs-main' },
              children: [
                { component: DocArticle, props: { page, locale } },
              ],
            },
            {
              tag: 'aside',
              props: { className: 'cli-docs-toc' },
              children: [
                { component: DocsToc, props: { page, locale } },
              ],
            },
          ],
        },
      ],
    };
  }

  private renderLanguageSwitcher(): VNode {
    const { page, locale } = this.props;

    return {
      tag: 'label',
      props: {
        className: 'cli-docs-lang',
        'data-cli-lang': '',
        'data-cli-lang-path': page.path,
        'aria-label': pick('切换语言', 'Switch language', locale),
      },
      children: [
        {
          tag: 'select',
          props: { className: 'cli-docs-lang-select' },
          children: [
            {
              tag: 'option',
              props: { value: 'zh', selected: locale === 'zh' },
              children: ['中文'],
            },
            {
              tag: 'option',
              props: { value: 'en', selected: locale === 'en' },
              children: ['English'],
            },
          ],
        },
      ],
    };
  }
}
