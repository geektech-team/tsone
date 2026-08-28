import { Component, type VNode } from '@geektech/tsone';
import type { OneDocPage } from '../content';

export interface DocsNavProps {
  pages: OneDocPage[];
  currentPath: string;
}

export class DocsNav extends Component<DocsNavProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'nav',
      props: {
        className: 'one-docs-nav',
        'aria-label': '文档导航',
      },
      children: this.groupPages().map(([section, pages]) => ({
        tag: 'section',
        props: { className: 'one-docs-nav-section' },
        children: [
          { tag: 'h2', children: [section] },
          {
            tag: 'ul',
            children: pages.map((page) => ({
              tag: 'li',
              children: [
                {
                  tag: 'a',
                  props: {
                    href: page.path,
                    className:
                      page.path === this.props.currentPath ? 'active' : '',
                    'aria-current':
                      page.path === this.props.currentPath ? 'page' : undefined,
                  },
                  children: [page.title],
                },
              ],
            })),
          },
        ],
      })),
    };
  }

  private groupPages(): Array<[OneDocPage['section'], OneDocPage[]]> {
    const groups = new Map<OneDocPage['section'], OneDocPage[]>();

    this.props.pages.forEach((page) => {
      const pages = groups.get(page.section) ?? [];
      pages.push(page);
      groups.set(page.section, pages);
    });

    return [...groups.entries()];
  }
}
