import { Component, type VNode } from '../../../lib';
import type { DocPage } from '../content';

export interface DocsNavProps {
  pages: DocPage[];
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
        className: 'docs-nav',
        'aria-label': 'Documentation',
      },
      children: this.groupPages().map(([section, pages]) => ({
        tag: 'section',
        props: { className: 'docs-nav-section' },
        children: [
          {
            tag: 'h2',
            children: [section],
          },
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

  private groupPages(): Array<[string, DocPage[]]> {
    const groups = new Map<string, DocPage[]>();

    this.props.pages.forEach((page) => {
      const sectionPages = groups.get(page.section) ?? [];
      sectionPages.push(page);
      groups.set(page.section, sectionPages);
    });

    return [...groups.entries()];
  }
}
