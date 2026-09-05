import { Component, type VNode } from '../../../lib';
import { withDocBasePath } from '../content/base';
import type { DocLocaleMessages, SearchEntry } from '../content';

export interface SearchBoxProps {
  entries: SearchEntry[];
  messages: DocLocaleMessages;
}

interface SearchBoxState {
  query: string;
}

export class SearchBox extends Component<SearchBoxProps, SearchBoxState> {
  protected initState(): SearchBoxState {
    return { query: '' };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    const query = this.state.query.trim().toLowerCase();
    const matches =
      query.length === 0
        ? []
        : this.props.entries
            .filter(
              (entry) =>
                entry.title.toLowerCase().includes(query) ||
                entry.section.toLowerCase().includes(query) ||
                entry.text.includes(query)
            )
            .slice(0, 8);

    return {
      tag: 'div',
      props: { className: 'docs-search-widget' },
      children: [
        {
          tag: 'input',
          props: {
            type: 'search',
            value: this.state.query,
            placeholder: this.props.messages.searchPlaceholder,
            'aria-label': this.props.messages.searchLabel,
          },
          listeners: {
            input: (event: Event) => {
              this.state.query = (event.target as HTMLInputElement).value;
            },
          },
        },
        {
          tag: 'ul',
          props: { className: 'docs-search-results' },
          children: matches.map((entry) => ({
            tag: 'li',
            children: [
              {
                tag: 'a',
                props: { href: withDocBasePath(entry.path) },
                children: [`${entry.section} / ${entry.title}`],
              },
            ],
          })),
        },
      ],
    };
  }
}
