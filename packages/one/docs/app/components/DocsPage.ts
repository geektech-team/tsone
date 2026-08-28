import { Component, type VNode } from '@geektech/tsone';
import type { OneDocPage } from '../content';
import { DocArticle } from './DocArticle';
import { DocsNav } from './DocsNav';
import { DocsToc } from './DocsToc';

export interface DocsPageProps {
  page: OneDocPage;
  pages: OneDocPage[];
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
        className: 'one-docs-shell',
        'data-one-docs-page': this.props.page.path,
      },
      children: [
        {
          tag: 'header',
          props: { className: 'one-docs-topbar' },
          children: [
            {
              tag: 'a',
              props: { className: 'one-docs-brand', href: '/' },
              children: ['One UI'],
            },
            {
              tag: 'nav',
              props: {
                className: 'one-docs-topnav',
                'aria-label': '顶部导航',
              },
              children: [
                {
                  tag: 'a',
                  props: { href: '/guide/design/' },
                  children: ['设计理念'],
                },
                {
                  tag: 'a',
                  props: { href: '/components/button/' },
                  children: ['组件'],
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
                  props: {
                    pages: this.props.pages,
                    currentPath: this.props.page.path,
                  },
                },
              ],
            },
            {
              tag: 'main',
              props: { className: 'one-docs-main' },
              children: [
                { component: DocArticle, props: { page: this.props.page } },
              ],
            },
            {
              tag: 'aside',
              props: { className: 'one-docs-toc' },
              children: [
                { component: DocsToc, props: { page: this.props.page } },
              ],
            },
          ],
        },
      ],
    };
  }
}
