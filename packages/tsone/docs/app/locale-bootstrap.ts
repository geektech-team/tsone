import {
  isDocLocale,
  resolvePreferredDocLocale,
  type DocLocale,
} from './content/locales';

export interface LocaleBootstrapEnvironment {
  pathname: string;
  storage?: Pick<Storage, 'getItem'>;
  languages?: readonly string[];
  replace: (href: string) => void;
}

export function runDocsLocaleBootstrap(
  environment: LocaleBootstrapEnvironment
): void {
  if (environment.pathname !== '/') {
    return;
  }

  let storedLocale: DocLocale | undefined;
  try {
    const stored = environment.storage?.getItem('tsone-docs-locale');
    if (isDocLocale(stored)) {
      storedLocale = stored;
    }
  } catch {
    storedLocale = undefined;
  }

  const locale = resolvePreferredDocLocale(
    storedLocale,
    environment.languages ?? []
  );
  if (locale === 'en') {
    environment.replace('/en/');
  }
}
