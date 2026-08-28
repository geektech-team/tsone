import { Component, type VNode } from '@geektech/tsone';
import { headingsForPage, type OneDocPage } from '../content';

export interface DocsTocProps {
  page: OneDocPage;
}

export class DocsToc extends Component<DocsTocProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'nav',
      props: { className: 'one-docs-toc-nav', 'aria-label': '本文目录' },
      children: [
        { tag: 'strong', children: ['本页内容'] },
        {
          tag: 'ol',
          children: headingsForPage(this.props.page).map((heading) => ({
            tag: 'li',
            props: {
              className: `one-docs-toc-level-${heading.level}`,
            },
            children: [
              {
                tag: 'a',
                props: { href: `#${heading.id}` },
                children: [heading.text],
              },
            ],
          })),
        },
      ],
    };
  }
}
