import { Component, type VNode } from '@geektech/tsone';
import { OneSelect, type OneFieldValueEvent } from '../../../lib';
import type { OneDocLocale } from '../content';
import { localeHref, pick } from '../locale';

export interface LangSwitcherProps {
  path: string;
  locale: OneDocLocale;
}

const LANGUAGE_OPTIONS = [
  { value: 'zh', label: '\u4e2d\u6587' },
  { value: 'en', label: 'English' },
];

export class LangSwitcher extends Component<LangSwitcherProps, object> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    const { path, locale } = this.props;
    return {
      tag: 'div',
      props: { className: 'one-docs-lang' },
      children: [
        {
          component: OneSelect,
          props: {
            options: LANGUAGE_OPTIONS,
            value: locale,
            ariaLabel: pick('切换语言', 'Switch language', locale),
          },
          emitters: {
            change: (payload: unknown) => {
              const event = payload as OneFieldValueEvent<string>;
              const next = event.value === 'en' ? 'en' : 'zh';
              const target = localeHref(path, next);
              if (window.location.pathname + window.location.search !== target) {
                window.location.assign(target);
              }
            },
          },
        },
      ],
    };
  }
}
