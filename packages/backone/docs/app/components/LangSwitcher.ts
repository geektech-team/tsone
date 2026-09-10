import { Component, type VNode } from '@geektech/tsone';
import type { BackOneDocLocale } from '../content';
import { pick } from '../locale';

export interface LangSwitcherProps {
  path: string;
  locale: BackOneDocLocale;
}

const LANGUAGE_OPTIONS: Array<{ value: BackOneDocLocale; label: string }> = [
  { value: 'zh', label: '\u4e2d\u6587' },
  { value: 'en', label: 'English' },
];

export class LangSwitcher extends Component<LangSwitcherProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    const { locale } = this.props;

    return {
      tag: 'select',
      props: {
        className: 'backone-docs-lang-select',
        'data-backone-lang': '',
        'aria-label': pick('切换语言', 'Switch language', locale),
      },
      children: LANGUAGE_OPTIONS.map((option) => ({
        tag: 'option',
        props: {
          value: option.value,
          selected: option.value === locale,
        },
        children: [option.label],
      })),
    };
  }
}
