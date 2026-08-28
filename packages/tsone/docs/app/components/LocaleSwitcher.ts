import { Component, type VNode } from '../../../lib';
import {
  DOC_LOCALE_CONFIGS,
  isDocLocale,
  localizeDocPath,
  type DocLocale,
  type DocLocaleMessages,
} from '../content';

export interface LocaleSwitcherProps {
  locale: DocLocale;
  logicalPath: string;
  messages: DocLocaleMessages;
}

export function getDocLocaleStorage(
  source: Pick<Window, 'localStorage'>
): Pick<Storage, 'setItem'> | undefined {
  try {
    return source.localStorage;
  } catch {
    return undefined;
  }
}

export function applyDocLocaleSelection(
  targetLocale: DocLocale,
  logicalPath: string,
  storage: Pick<Storage, 'setItem'> | undefined,
  navigate: (href: string) => void
): void {
  try {
    storage?.setItem('tsone-docs-locale', targetLocale);
  } catch {
    // Navigation must still proceed when storage is unavailable.
  }

  navigate(localizeDocPath(targetLocale, logicalPath));
}

export class LocaleSwitcher extends Component<LocaleSwitcherProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'select',
      props: {
        className: 'docs-locale-select',
        value: this.props.locale,
        'aria-label': this.props.messages.languageLabel,
      },
      listeners: {
        change: (event: Event) => {
          const targetLocale = (event.target as HTMLSelectElement).value;
          if (!isDocLocale(targetLocale)) {
            return;
          }

          applyDocLocaleSelection(
            targetLocale,
            this.props.logicalPath,
            getDocLocaleStorage(window),
            (href) => {
              window.location.href = href;
            }
          );
        },
      },
      children: (['zh', 'en'] as const).map((locale) => ({
        tag: 'option',
        props: {
          value: locale,
          selected: locale === this.props.locale,
        },
        children: [DOC_LOCALE_CONFIGS[locale].label],
      })),
    };
  }
}
