import {
  ONE_DEFAULT_LOCALE,
  ONE_FALLBACK_LOCALE,
  ONE_I18N_MESSAGES,
  type OneI18nMessages,
  type OneI18nParams,
} from './messages';

export class OneI18nConfigError extends Error {}

export interface OneI18nOptions {
  /** 当前语言，默认 zh-CN */
  locale?: string;
  /** 缺失 key 时的回退语言，默认 zh-CN */
  fallbackLocale?: string;
  /** 按语言合并进内置字典的消息 */
  messages?: Partial<Record<string, OneI18nMessages>>;
}

export interface OneI18nSubscriber {
  readonly mounted: boolean;
  update(): void;
}

function assertLocale(locale: unknown): asserts locale is string {
  if (
    typeof locale !== 'string' ||
    locale.length === 0 ||
    locale.trim() !== locale ||
    /\s/.test(locale)
  ) {
    throw new OneI18nConfigError(
      'Locale must be a non-empty string without whitespace.'
    );
  }
}

function mergeMessages(
  base: Readonly<Record<string, Readonly<OneI18nMessages>>>,
  extra?: Partial<Record<string, OneI18nMessages>>
): Record<string, OneI18nMessages> {
  const merged: Record<string, OneI18nMessages> = {};
  Object.keys(base).forEach((locale) => {
    merged[locale] = { ...base[locale] };
  });
  Object.entries(extra ?? {}).forEach(([locale, messages]) => {
    merged[locale] = { ...(merged[locale] ?? {}), ...(messages ?? {}) };
  });
  return merged;
}

function interpolate(template: string, params?: OneI18nParams): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined || value === null ? match : String(value);
  });
}

export class OneI18n {
  private locale: string;
  private readonly fallbackLocale: string;
  private readonly messages: Record<string, OneI18nMessages>;
  private readonly listeners = new Set<() => void>();
  private readonly subscribers = new Set<OneI18nSubscriber>();

  constructor(options: OneI18nOptions = {}) {
    assertLocale(options.locale ?? ONE_DEFAULT_LOCALE);
    assertLocale(options.fallbackLocale ?? ONE_FALLBACK_LOCALE);
    this.locale = options.locale ?? ONE_DEFAULT_LOCALE;
    this.fallbackLocale = options.fallbackLocale ?? ONE_FALLBACK_LOCALE;
    this.messages = mergeMessages(ONE_I18N_MESSAGES, options.messages);
  }

  public getLocale(): string {
    return this.locale;
  }

  public getFallbackLocale(): string {
    return this.fallbackLocale;
  }

  public setLocale(locale: string): void {
    assertLocale(locale);
    if (locale === this.locale) {
      return;
    }
    this.locale = locale;
    this.notify();
  }

  public t(key: string, params?: OneI18nParams): string {
    return interpolate(this.resolveMessage(key), params);
  }

  public has(key: string): boolean {
    return this.resolveMessage(key) !== key;
  }

  public mergeMessages(
    messages: Partial<Record<string, OneI18nMessages>>
  ): this {
    Object.entries(messages).forEach(([locale, entries]) => {
      this.messages[locale] = {
        ...(this.messages[locale] ?? {}),
        ...(entries ?? {}),
      };
    });
    return this;
  }

  public onLocaleChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public attach(subscriber: OneI18nSubscriber): void {
    if (this.subscribers.has(subscriber)) {
      return;
    }
    this.subscribers.add(subscriber);
  }

  public destroy(): void {
    this.listeners.clear();
    this.subscribers.clear();
  }

  private resolveMessage(key: string): string {
    const local = this.messages[this.locale]?.[key];
    if (local !== undefined) {
      return local;
    }
    if (this.fallbackLocale !== this.locale) {
      const fallback = this.messages[this.fallbackLocale]?.[key];
      if (fallback !== undefined) {
        return fallback;
      }
    }
    return key;
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (error) {
        console.error('One I18n locale listener error:', error);
      }
    });

    [...this.subscribers].forEach((subscriber) => {
      if (!subscriber.mounted) {
        this.subscribers.delete(subscriber);
        return;
      }
      try {
        subscriber.update();
      } catch (error) {
        console.error('One I18n subscriber update error:', error);
      }
    });
  }
}

export function createOneI18n(options?: OneI18nOptions): OneI18n {
  return new OneI18n(options);
}

export const oneI18n: OneI18n = new OneI18n();
