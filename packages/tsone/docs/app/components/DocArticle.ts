import { Component, type VNode } from '../../../lib';
import type { DocBlock, DocInline, DocPage } from '../content';

export interface DocArticleProps {
  page: DocPage;
}

export class DocArticle extends Component<DocArticleProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'article',
      props: { className: 'doc-article' },
      children: [
        {
          tag: 'p',
          props: { className: 'doc-section-label' },
          children: [this.props.page.section],
        },
        ...this.props.page.body.map((block) => this.renderBlock(block)),
      ],
    };
  }

  private renderBlock(block: DocBlock): VNode {
    switch (block.type) {
      case 'heading':
        return {
          tag: `h${block.level}`,
          children: [block.text],
        };
      case 'paragraph':
        return {
          tag: 'p',
          children: this.renderInline(block.content),
        };
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
          props: { className: `doc-callout doc-callout-${block.kind}` },
          children: [
            {
              tag: 'strong',
              children: [block.title],
            },
            {
              tag: 'p',
              children: this.renderInline(block.body),
            },
          ],
        };
      case 'api-table':
        return {
          tag: 'table',
          props: { className: 'doc-api-table' },
          children: [
            {
              tag: 'thead',
              children: [
                {
                  tag: 'tr',
                  children: [
                    { tag: 'th', children: ['Name'] },
                    { tag: 'th', children: ['Signature'] },
                    { tag: 'th', children: ['Description'] },
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
                  { tag: 'td', children: [row.description] },
                ],
              })),
            },
          ],
        };
    }
  }

  private renderInline(content: DocInline[]): Array<VNode | string> {
    return content.map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      if (item.type === 'code') {
        return {
          tag: 'code',
          children: [item.text],
        };
      }

      return {
        tag: 'a',
        props: { href: item.href },
        children: [item.text],
      };
    });
  }
}
