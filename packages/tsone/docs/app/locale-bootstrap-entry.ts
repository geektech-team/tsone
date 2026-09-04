import {
  runDocsLocaleBootstrap,
  type LocaleBootstrapEnvironment,
} from './locale-bootstrap';
import { readDocBaseFromDocument } from './content/base';

export interface NavigatorLanguageSource {
  readonly languages?: readonly string[];
  readonly language?: string;
}

export function readNavigatorLanguages(
  source: NavigatorLanguageSource
): readonly string[] {
  try {
    const languages = source.languages;
    if (
      Array.isArray(languages) &&
      languages.some(
        (language) => typeof language === 'string' && language.trim()
      )
    ) {
      return languages;
    }
  } catch {
    // Fall through to the singular browser language.
  }

  try {
    const language = source.language;
    return typeof language === 'string' && language.trim() ? [language] : [];
  } catch {
    return [];
  }
}

function getStorage(): LocaleBootstrapEnvironment['storage'] {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

runDocsLocaleBootstrap({
  pathname: window.location.pathname,
  basePath: readDocBaseFromDocument(window.document),
  storage: getStorage(),
  languages: readNavigatorLanguages(window.navigator),
  replace: (href) => window.location.replace(href),
});
