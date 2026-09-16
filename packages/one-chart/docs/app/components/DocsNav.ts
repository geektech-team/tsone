import { Component, type VNode } from '@geektech/tsone';
import {
  localize,
  sectionLabel,
  type OneChartDocLocale,
  type OneChartDocPage,
  type OneChartDocSection,
} from '../content';
import { localeHref, pick } from '../locale';

export interface DocsNavProps {
  pages: OneChartDocPage[];
  currentPath: string;
  locale: OneChartDocLocale;
}

const SECTION_ORDER: readonly OneChartDocSection[] = [
  'start',
  'guide',
  'charts',
];

export class DocsNav extends Component<DocsNavProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    const { locale, currentPath } = this.props;

    return {
      tag: 'nav',
      props: {
        className: 'one-chart-docs-nav',
        'aria-label': pick('文档导航', 'Documentation', locale),
      },
      children: SECTION_ORDER.filter((section) =>
        this.props.pages.some((page) => page.section === section)
      ).map((section) => ({
        tag: 'section',
        props: { className: 'one-chart-docs-nav-section' },
        children: [
          { tag: 'h2', children: [sectionLabel(section, locale)] },
          {
            tag: 'ul',
            children: this.props.pages
              .filter((page) => page.section === section)
              .map((page) =>
                this.renderNavItem(page, locale, currentPath)
              ),
          },
        ],
      })),
    };
  }

  private renderNavItem(
    page: OneChartDocPage,
    locale: OneChartDocLocale,
    currentPath: string
  ): VNode {
    return {
      tag: 'li',
      props: { className: 'one-chart-docs-nav-item' },
      children: [
        {
          tag: 'a',
          props: {
            href: localeHref(page.path, locale),
            className: page.path === currentPath ? 'active' : '',
            'aria-current': page.path === currentPath ? 'page' : undefined,
          },
          children: [localize(page.title, locale)],
        },
      ],
    };
  }
}
