import { Component, type VNode } from '@geektech/tsone';
import {
  headingsForPage,
  localize,
  type BackOneDocLocale,
  type BackOneDocPage,
} from '../content';
import { pick } from '../locale';

export interface DocsTocProps {
  page: BackOneDocPage;
  locale: BackOneDocLocale;
}

export class DocsToc extends Component<DocsTocProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    const { page, locale } = this.props;

    return {
      tag: 'nav',
      props: {
        className: 'backone-docs-toc-nav',
        'aria-label': pick('本文目录', 'On this page', locale),
      },
      children: [
        {
          tag: 'strong',
          children: [pick('本页内容', 'On this page', locale)],
        },
        {
          tag: 'ol',
          children: headingsForPage(page).map((heading) => ({
            tag: 'li',
            props: {
              className: `backone-docs-toc-level-${heading.level}`,
            },
            children: [
              {
                tag: 'a',
                props: { href: `#${heading.id}` },
                children: [localize(heading.text, locale)],
              },
            ],
          })),
        },
      ],
    };
  }
}
