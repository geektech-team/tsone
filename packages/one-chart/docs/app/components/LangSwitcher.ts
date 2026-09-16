import { Component, type VNode } from '@geektech/tsone';
import type { OneChartDocLocale } from '../content';
import { localeHref } from '../locale';

export interface LangSwitcherProps {
  path: string;
  locale: OneChartDocLocale;
  options?: Array<{ value: string; label: string }>;
}

const DEFAULT_OPTIONS = [
  { value: 'zh', label: '\u4e2d\u6587' },
  { value: 'en', label: 'English' },
];

export class LangSwitcher extends Component<LangSwitcherProps> {
  private readonly handleChange = (event: Event): void => {
    const value = (event.target as HTMLSelectElement | null)?.value;
    if (value === 'zh' || value === 'en') {
      window.location.href = localeHref(this.props.path, value);
    }
  };

  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    const options = this.props.options ?? DEFAULT_OPTIONS;
    return {
      tag: 'select',
      props: {
        'aria-label': 'Switch language',
      },
      listeners: { change: this.handleChange },
      children: options.map((option) => ({
        tag: 'option',
        props: {
          value: option.value,
          selected: option.value === this.props.locale ? '' : undefined,
        },
        children: [option.label],
      })),
    };
  }
}
