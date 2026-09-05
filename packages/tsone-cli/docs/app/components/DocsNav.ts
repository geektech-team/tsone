import { Component, type VNode } from '@geektech/tsone';
import {
  localize,
  sectionLabel,
  type CliDocLocale,
  type CliDocPage,
  type CliDocSection,
} from '../content';
import { localeHref, pick } from '../locale';

export interface DocsNavProps {
  pages: CliDocPage[];
  currentPath: string;
  locale: CliDocLocale;
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
        className: 'cli-docs-nav',
        'aria-label': pick('文档导航', 'Documentation', locale),
      },
      children: this.groupPages().map(([section, pages]) => ({
        tag: 'section',
        props: {
          className: `cli-docs-nav-section cli-docs-nav-section--${section}`,
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

  private groupPages(): Array<[CliDocSection, CliDocPage[]]> {
    const groups = new Map<CliDocSection, CliDocPage[]>();

    this.props.pages.forEach((page) => {
      const pages = groups.get(page.section) ?? [];
      pages.push(page);
      groups.set(page.section, pages);
    });

    return [...groups.entries()];
  }

  private renderNavItem(
    page: CliDocPage,
    locale: CliDocLocale,
    currentPath: string
  ): VNode {
    const isCurrent = page.path === currentPath;

    return {
      tag: 'li',
      props: { className: 'cli-docs-nav-item' },
      children: [
        {
          tag: 'a',
          props: {
            href: localeHref(page.path, locale),
            className: isCurrent ? 'active' : '',
            'aria-current': isCurrent ? 'page' : undefined,
          },
          children: [localize(page.title, locale)],
        },
      ],
    };
  }
}
