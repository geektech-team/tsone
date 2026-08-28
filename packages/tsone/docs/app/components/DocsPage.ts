import { Component, type VNode } from '../../../lib';
import {
  localizeDocPath,
  type DocLocale,
  type DocLocaleMessages,
  type DocPage,
} from '../content';
import { DocArticle } from './DocArticle';
import { DocsNav } from './DocsNav';

export interface DocsPageProps {
  locale: DocLocale;
  page: DocPage;
  pages: DocPage[];
  messages: DocLocaleMessages;
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
        'data-tsone-docs-locale': this.props.locale,
        'data-tsone-docs-page': this.props.page.path,
      },
      children: [
        {
          tag: 'header',
          props: { className: 'docs-topbar' },
          children: [
            {
              tag: 'a',
              props: {
                href: localizeDocPath(this.props.locale, '/'),
                className: 'docs-brand',
              },
              children: ['TSone'],
            },
            {
              tag: 'div',
              props: {
                className: 'docs-tools',
              },
              children: [
                {
                  tag: 'div',
                  props: { 'data-doc-locale-root': '' },
                  children: [],
                },
                {
                  tag: 'div',
                  props: { 'data-doc-theme-root': '' },
                  children: [],
                },
              ],
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
                    locale: this.props.locale,
                    pages: this.props.pages,
                    currentPath: this.props.page.path,
                    messages: this.props.messages,
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
                  props: {
                    locale: this.props.locale,
                    page: this.props.page,
                    messages: this.props.messages,
                  },
                },
              ],
            },
          ],
        },
      ],
    };
  }
}
