import { normalizeDocPath } from './types';
import { stripDocBasePath, withDocBasePath } from './base';

export type DocLocale = 'zh' | 'en';

export interface DocLocaleMessages {
  searchPlaceholder: string;
  searchLabel: string;
  navigationLabel: string;
  languageLabel: string;
  themeToggleLabel: string;
  lightThemeLabel: string;
  darkThemeLabel: string;
  apiNameLabel: string;
  apiSignatureLabel: string;
  apiDescriptionLabel: string;
}

export interface DocLocaleConfig {
  locale: DocLocale;
  htmlLang: 'zh-CN' | 'en';
  pathPrefix: '' | '/en';
  label: string;
  messages: DocLocaleMessages;
}

export const DOC_LOCALE_CONFIGS: Record<DocLocale, DocLocaleConfig> = {
  zh: {
    locale: 'zh',
    htmlLang: 'zh-CN',
    pathPrefix: '',
    label: '中文',
    messages: {
      searchPlaceholder: '搜索文档',
      searchLabel: '搜索文档',
      navigationLabel: '文档导航',
      languageLabel: '文档语言',
      themeToggleLabel: '切换文档主题',
      lightThemeLabel: '浅色',
      darkThemeLabel: '深色',
      apiNameLabel: '名称',
      apiSignatureLabel: '签名',
      apiDescriptionLabel: '说明',
    },
  },
  en: {
    locale: 'en',
    htmlLang: 'en',
    pathPrefix: '/en',
    label: 'English',
    messages: {
      searchPlaceholder: 'Search docs',
      searchLabel: 'Search documentation',
      navigationLabel: 'Documentation',
      languageLabel: 'Documentation language',
      themeToggleLabel: 'Toggle documentation theme',
      lightThemeLabel: 'Light',
      darkThemeLabel: 'Dark',
      apiNameLabel: 'Name',
      apiSignatureLabel: 'Signature',
      apiDescriptionLabel: 'Description',
    },
  },
};

export function isDocLocale(value: unknown): value is DocLocale {
  return value === 'zh' || value === 'en';
}

export function localizeDocPath(
  locale: DocLocale,
  logicalPath: string
): string {
  const normalizedPath = normalizeDocPath(logicalPath);
  const prefix = DOC_LOCALE_CONFIGS[locale].pathPrefix;

  const localized =
    prefix === ''
      ? normalizedPath
      : normalizedPath === '/'
        ? `${prefix}/`
        : `${prefix}${normalizedPath}`;

  return withDocBasePath(localized);
}

export function parseLocalizedDocPath(path: string): {
  locale: DocLocale;
  logicalPath: string;
} {
  const strippedPath = stripDocBasePath(path);

  if (strippedPath === '/en' || strippedPath.startsWith('/en/')) {
    const logicalPath =
      strippedPath === '/en' ? '/' : strippedPath.slice('/en'.length);

    return { locale: 'en', logicalPath: normalizeDocPath(logicalPath) };
  }

  return { locale: 'zh', logicalPath: normalizeDocPath(strippedPath) };
}

export function switchDocLocale(path: string, targetLocale: DocLocale): string {
  const { logicalPath } = parseLocalizedDocPath(path);
  return localizeDocPath(targetLocale, logicalPath);
}

export function localizeDocHref(locale: DocLocale, href: string): string {
  if (!href.startsWith('/') || href.startsWith('//')) {
    return href;
  }

  return switchDocLocale(href, locale);
}

export function resolvePreferredDocLocale(
  stored: unknown,
  languages: readonly string[] = []
): DocLocale {
  if (isDocLocale(stored)) {
    return stored;
  }

  const preferredLanguage = languages.find(
    (language) => language.trim().length > 0
  );
  if (preferredLanguage?.toLowerCase().startsWith('zh')) {
    return 'zh';
  }

  if (preferredLanguage) {
    return 'en';
  }

  return 'zh';
}
