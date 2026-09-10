import { Component, type VNode } from '@geektech/tsone';
import {
  localize,
  sectionLabel,
  type BackOneDocLocale,
  type BackOneDocPage,
  type BackOneDocSection,
} from '../content';
import { localeHref, pick } from '../locale';

export interface DocsNavProps {
  pages: BackOneDocPage[];
  currentPath: string;
  locale: BackOneDocLocale;
}

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
        className: 'backone-docs-nav',
        'aria-label': pick('文档导航', 'Documentation', locale),
      },
      children: this.groupPages().map(([section, pages]) => ({
        tag: 'section',
        props: {
          className: `backone-docs-nav-section backone-docs-nav-section--${section}`,
        },
        children: [
          { tag: 'h2', children: [sectionLabel(section, locale)] },
          {
            tag: 'ul',
            children: pages.map((page) =>
              this.renderNavItem(page, locale, currentPath)
            ),
          },
        ],
      })),
    };
  }

  private groupPages(): Array<[BackOneDocSection, BackOneDocPage[]]> {
    const groups = new Map<BackOneDocSection, BackOneDocPage[]>();

    this.props.pages.forEach((page) => {
      const pages = groups.get(page.section) ?? [];
      pages.push(page);
      groups.set(page.section, pages);
    });

    return [...groups.entries()];
  }

  private renderNavItem(
    page: BackOneDocPage,
    locale: BackOneDocLocale,
    currentPath: string
  ): VNode {
    return {
      tag: 'li',
      props: { className: 'backone-docs-nav-item' },
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
