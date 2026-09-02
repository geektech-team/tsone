import { Component, type VNode } from '@geektech/tsone';
import {
  localize,
  sectionLabel,
  type OneDocLocale,
  type OneDocPage,
  type OneDocSection,
} from '../content';
import { localeHref, pick } from '../locale';

export interface DocsNavProps {
  pages: OneDocPage[];
  currentPath: string;
  locale: OneDocLocale;
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
        className: 'one-docs-nav',
        'aria-label': pick('文档导航', 'Documentation', locale),
      },
      children: this.groupPages().map(([section, pages]) => ({
        tag: 'section',
        props: {
          className: `one-docs-nav-section one-docs-nav-section--${section}`,
        },
        children: [
          { tag: 'h2', children: [sectionLabel(section, locale)] },
          {
            tag: 'ul',
            children:
              section === 'components'
                ? this.renderComponentSectionChildren(pages, locale, currentPath)
                : this.renderSimpleSectionChildren(
                    section,
                    pages,
                    locale,
                    currentPath
                  ),
          },
        ],
      })),
    };
  }

  private groupPages(): Array<[OneDocSection, OneDocPage[]]> {
    const groups = new Map<OneDocSection, OneDocPage[]>();

    this.props.pages.forEach((page) => {
      const pages = groups.get(page.section) ?? [];
      pages.push(page);
      groups.set(page.section, pages);
    });

    return [...groups.entries()];
  }

  private renderSimpleSectionChildren(
    section: OneDocSection,
    pages: OneDocPage[],
    locale: OneDocLocale,
    currentPath: string
  ): VNode[] {
    return pages.map((page) =>
      this.renderNavItem(
        page,
        locale,
        currentPath,
        this.getNavItemClass(section, page)
      )
    );
  }

  private renderComponentSectionChildren(
    pages: OneDocPage[],
    locale: OneDocLocale,
    currentPath: string
  ): VNode[] {
    const componentGroups = this.groupComponentPages(pages, locale);

    return componentGroups.flatMap((group) => [
      {
        tag: 'li',
        props: {
          className:
            'one-docs-nav-item one-docs-nav-item--category one-docs-nav-item--category-label',
        },
        children: this.renderCategoryLabel(
          group.pages,
          locale,
          group.label
        ),
      },
      ...group.pages
        .filter((page) => !this.isComponentCategoryPage(page.path))
        .map((page) =>
        this.renderNavItem(
          page,
          locale,
          currentPath,
          this.getNavItemClass('components', page)
        )
      ),
    ]);
  }

  private renderCategoryLabel(
    pages: OneDocPage[],
    locale: OneDocLocale,
    fallbackLabel: string
  ): VNode['children'] {
    const categoryPathPage = pages.find((page) =>
      this.isComponentCategoryPage(page.path)
    );

    return [categoryPathPage
      ? stripOnePrefix(localize(categoryPathPage.title, locale))
      : fallbackLabel];
  }

  private renderNavItem(
    page: OneDocPage,
    locale: OneDocLocale,
    currentPath: string,
    className: string
  ): VNode {
    return {
      tag: 'li',
      props: { className },
      children: [
        {
          tag: 'a',
          props: {
            href: localeHref(page.path, locale),
            className: page.path === currentPath ? 'active' : '',
            'aria-current': page.path === currentPath ? 'page' : undefined,
          },
          children: [stripOnePrefix(localize(page.title, locale))],
        },
      ],
    };
  }

  private groupComponentPages(pages: OneDocPage[], locale: OneDocLocale) {
    const groups = new Map<string, { label: string; pages: OneDocPage[] }>();
    const orderedKeys: string[] = [];

    pages.forEach((page) => {
      const category = this.getComponentCategory(page.path);
      const existing = groups.get(category);
      const label =
        category === 'general'
          ? pick('通用', 'General', locale)
          : this.getComponentCategoryTitle(category, locale);

      if (!existing) {
        orderedKeys.push(category);
        groups.set(category, { label, pages: [] });
      }

      groups.get(category)!.pages.push(page);
    });

    return orderedKeys.map((key) => ({
      key,
      label: groups.get(key)!.label,
      pages: groups.get(key)!.pages,
    }));
  }

  private getComponentCategory(path: string): string {
    const normalized = path.replace(/^\/+|\/+$/g, '');
    const segments = normalized.split('/');

    if (segments[0] !== 'components') {
      return 'general';
    }

    if (segments.length === 2) {
      return this.hasComponentChildren(path) ? segments[1] : 'general';
    }

    if (segments.length === 3) {
      return segments[1];
    }

    return segments[1] ?? 'general';
  }

  private getComponentCategoryTitle(
    category: string,
    locale: OneDocLocale
  ): string {
    const categoryPath = `/components/${category}/`;
    const categoryPage = this.props.pages.find(
      (page) => page.section === 'components' && page.path === categoryPath
    );

    return categoryPage
      ? stripOnePrefix(localize(categoryPage.title, locale))
      : category;
  }

  private getNavItemClass(section: OneDocSection, page: OneDocPage): string {
    const classes = ['one-docs-nav-item'];

    if (section !== 'components') {
      return classes.join(' ');
    }

    const isLeafComponent = this.isLeafComponentPage(page.path);
    const isComponentCategory = this.isComponentCategoryPage(page.path);

    classes.push('one-docs-nav-item--component');

    if (isLeafComponent) {
      classes.push('one-docs-nav-item--leaf');
    }

    if (isComponentCategory) {
      classes.push('one-docs-nav-item--category');
    }

    return classes.join(' ');
  }

  private isComponentCategoryPage(path: string): boolean {
    if (!path.startsWith('/components/') || !path.endsWith('/')) {
      return false;
    }

    if (path === '/components/') {
      return false;
    }

    const segments = path.replace(/^\/+|\/+$/g, '').split('/');
    if (segments.length !== 2) {
      return false;
    }

    return this.hasComponentChildren(path);
  }

  private isLeafComponentPage(path: string): boolean {
    if (!path.startsWith('/components/') || !path.endsWith('/')) {
      return false;
    }

    const segments = path.replace(/^\/+|\/+$/g, '').split('/');
    if (segments.length === 3) {
      return true;
    }

    if (segments.length === 2) {
      return !this.hasComponentChildren(path);
    }

    return false;
  }

  private hasComponentChildren(path: string): boolean {
    return this.props.pages.some(
      (page) =>
        page.section === 'components' &&
        page.path !== path &&
        page.path.startsWith(path) &&
        /^\/components\/[^/]+\/[^/]+\/$/.test(page.path)
    );
  }
}

function stripOnePrefix(label: string): string {
  return label.startsWith('One') ? label.slice(3) : label;
}
