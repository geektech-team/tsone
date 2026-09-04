import {
  isDocLocale,
  resolvePreferredDocLocale,
  type DocLocale,
} from './content/locales';
import { setDocBasePath, withDocBasePath } from './content/base';

export interface LocaleBootstrapEnvironment {
  pathname: string;
  basePath?: string;
  storage?: Pick<Storage, 'getItem'>;
  languages?: readonly string[];
  replace: (href: string) => void;
}

export function runDocsLocaleBootstrap(
  environment: LocaleBootstrapEnvironment
): void {
  setDocBasePath(environment.basePath ?? '');

  if (environment.pathname !== withDocBasePath('/')) {
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
    environment.replace(withDocBasePath('/en/'));
  }
}
