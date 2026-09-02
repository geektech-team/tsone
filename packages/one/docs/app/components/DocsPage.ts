import { Component, type VNode } from '@geektech/tsone';
import { OneSwitch } from '../../../lib/switch/OneSwitch';
import type { OneDocLocale, OneDocPage } from '../content';
import { localeHref, pick } from '../locale';
import { DocArticle } from './DocArticle';
import { DocsNav } from './DocsNav';
import { DocsToc } from './DocsToc';

export interface DocsPageProps {
  page: OneDocPage;
  pages: OneDocPage[];
  locale: OneDocLocale;
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
        className: 'one-docs-shell',
        'data-one-docs-page': page.path,
        'data-one-docs-locale': locale,
      },
      children: [
        {
          tag: 'header',
          props: { className: 'one-docs-topbar' },
          children: [
            {
              tag: 'a',
              props: { className: 'one-docs-brand', href: localeHref('/', locale) },
              children: ['One UI'],
            },
            {
              tag: 'div',
              props: { className: 'one-docs-topbar-end' },
              children: [
                {
                  tag: 'nav',
                  props: {
                    className: 'one-docs-topnav',
                    'aria-label': pick('顶部导航', 'Top navigation', locale),
                  },
                  children: [
                    {
                      tag: 'a',
                      props: { href: localeHref('/guide/design/', locale) },
                      children: [pick('设计理念', 'Design principles', locale)],
                    },
                    {
                      tag: 'a',
                      props: { href: localeHref('/components/button/', locale) },
                      children: [pick('组件', 'Components', locale)],
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
                this.renderLanguageSwitcher(),
              ],
            },
          ],
        },
        {
          tag: 'div',
          props: { className: 'one-docs-layout' },
          children: [
            {
              tag: 'aside',
              props: { className: 'one-docs-sidebar' },
              children: [
                {
                  component: DocsNav,
                  props: { pages, currentPath: page.path, locale },
                },
              ],
            },
            {
              tag: 'main',
              props: { className: 'one-docs-main' },
              children: [
                { component: DocArticle, props: { page, locale } },
              ],
            },
            {
              tag: 'aside',
              props: { className: 'one-docs-toc' },
              children: [
                { component: DocsToc, props: { page, locale } },
              ],
            },
          ],
        },
      ],
    };
  }

  private renderThemeSwitcher(): VNode {
    const { locale } = this.props;

    return {
      tag: 'div',
      props: {
        className: 'one-docs-theme',
        'data-one-theme-toggle': '',
        'aria-label': pick('切换主题', 'Switch theme', locale),
      },
      children: [
        {
          component: OneSwitch,
          props: {
            ariaLabel: pick('切换主题', 'Switch theme', locale),
            defaultChecked: false,
          },
        },
        {
          tag: 'span',
          props: { className: 'one-docs-theme-label' },
          children: [pick('主题', 'Theme', locale)],
        },
      ],
    };
  }

  private renderLanguageSwitcher(): VNode {
    const { page, locale } = this.props;

    return {
      tag: 'div',
      props: {
        className: 'one-docs-lang',
        'aria-label': pick('切换语言', 'Switch language', locale),
      },
      children: [
        {
          tag: 'a',
          props: {
            href: localeHref(page.path, 'zh'),
            'aria-current': locale === 'zh' ? 'true' : undefined,
            className: locale === 'zh' ? 'active' : '',
          },
          children: ['中文'],
        },
        {
          tag: 'a',
          props: {
            href: localeHref(page.path, 'en'),
            'aria-current': locale === 'en' ? 'true' : undefined,
            className: locale === 'en' ? 'active' : '',
          },
          children: ['English'],
        },
      ],
    };
  }
}
