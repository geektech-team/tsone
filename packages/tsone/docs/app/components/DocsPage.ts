import { Component, type VNode } from '../../../lib';
import type { DocPage } from '../content';
import { DocArticle } from './DocArticle';
import { DocsNav } from './DocsNav';

export interface DocsPageProps {
  page: DocPage;
  pages: DocPage[];
}

export class DocsPage extends Component<DocsPageProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: {
        className: 'docs-shell',
        'data-tsone-docs-page': this.props.page.path,
      },
      children: [
        {
          tag: 'header',
          props: { className: 'docs-topbar' },
          children: [
            {
              tag: 'a',
              props: { href: '/', className: 'docs-brand' },
              children: ['TSone'],
            },
            {
              tag: 'div',
              props: {
                className: 'docs-tools',
                'data-doc-theme-root': '',
              },
              children: [],
            },
          ],
        },
        {
          tag: 'div',
          props: { className: 'docs-layout' },
          children: [
            {
              tag: 'aside',
              props: { className: 'docs-sidebar' },
              children: [
                {
                  tag: 'div',
                  props: {
                    className: 'docs-search',
                    'data-doc-search-root': '',
                  },
                  children: [],
                },
                {
                  component: DocsNav,
                  props: {
                    pages: this.props.pages,
                    currentPath: this.props.page.path,
                  },
                },
              ],
            },
            {
              tag: 'main',
              props: { className: 'docs-main' },
              children: [
                {
                  component: DocArticle,
                  props: { page: this.props.page },
                },
              ],
            },
          ],
        },
      ],
    };
  }
}
