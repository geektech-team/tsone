import { Component, type VNode } from '@geektech/tsone';
import {
  localize,
  sectionLabel,
  type CliDocBlock,
  type CliDocInline,
  type CliDocLocale,
  type CliDocPage,
} from '../content';
import { localeHref, pick } from '../locale';

export interface DocArticleProps {
  page: CliDocPage;
  locale: CliDocLocale;
}

export class DocArticle extends Component<DocArticleProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    const { page, locale } = this.props;

    return {
      tag: 'article',
      props: { className: 'cli-doc-article' },
      children: [
        {
          tag: 'p',
          props: { className: 'cli-docs-section-label' },
          children: [sectionLabel(page.section, locale)],
        },
        ...page.body.map((block) => this.renderBlock(block)),
      ],
    };
  }

  private renderBlock(block: CliDocBlock): VNode {
    const { locale } = this.props;

    switch (block.type) {
      case 'heading':
        return {
          tag: `h${block.level}`,
          props: { id: block.id },
          children: [localize(block.text, locale)],
        };
      case 'paragraph':
        return { tag: 'p', children: this.renderInline(block.content) };
      case 'list':
        return {
          tag: 'ul',
          children: block.items.map((item) => ({
            tag: 'li',
            children: this.renderInline(item),
          })),
        };
      case 'code':
        return {
          tag: 'pre',
          children: [
            {
              tag: 'code',
              props: { className: `language-${block.language}` },
              children: [block.code],
            },
          ],
        };
      case 'callout':
        return {
          tag: 'aside',
          props: {
            className: `cli-docs-callout cli-docs-callout--${block.kind}`,
          },
          children: [
            { tag: 'strong', children: [localize(block.title, locale)] },
            { tag: 'p', children: this.renderInline(block.body) },
          ],
        };
      case 'api-table':
        return {
          tag: 'div',
          props: { className: 'cli-docs-api-scroll' },
          children: [
            {
              tag: 'table',
              props: { className: 'cli-docs-api-table' },
              children: [
                { tag: 'caption', children: [localize(block.caption, locale)] },
                {
                  tag: 'thead',
                  children: [
                    {
                      tag: 'tr',
                      children: [
                        {
                          tag: 'th',
                          props: { scope: 'col' },
                          children: [pick('名称', 'Name', locale)],
                        },
                        {
                          tag: 'th',
                          props: { scope: 'col' },
                          children: [pick('签名', 'Signature', locale)],
                        },
                        {
                          tag: 'th',
                          props: { scope: 'col' },
                          children: [pick('说明', 'Description', locale)],
                        },
                      ],
                    },
                  ],
                },
                {
                  tag: 'tbody',
                  children: block.rows.map((row) => ({
                    tag: 'tr',
                    children: [
                      {
                        tag: 'td',
                        children: [{ tag: 'code', children: [row.name] }],
                      },
                      {
                        tag: 'td',
                        children: [{ tag: 'code', children: [row.signature] }],
                      },
                      {
                        tag: 'td',
                        children: [localize(row.description, locale)],
                      },
                    ],
                  })),
                },
              ],
            },
          ],
        };
      default:
        return assertNever(block);
    }
  }

  private renderInline(content: CliDocInline[]): Array<VNode | string> {
    const { locale } = this.props;

    return content.map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      if ('type' in item) {
        if (item.type === 'code') {
          return { tag: 'code', children: [item.text] };
        }
        return {
          tag: 'a',
          props: { href: this.localizeHref(item.href) },
          children: [localize(item.text, locale)],
        };
      }

      return localize(item, locale);
    });
  }

  private localizeHref(href: string): string {
    if (
      href.startsWith('#') ||
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('//') ||
      href.startsWith('mailto:') ||
      href.startsWith('javascript:')
    ) {
      return href;
    }

    const { locale } = this.props;
    return localeHref(href, locale);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unsupported TSone CLI docs content: ${String(value)}`);
}
