import {
  renderHtmlDocument,
  type ComponentConstructor,
  type VNode,
} from '@geektech/tsone';
import { DocsPage, type DocsPageProps } from './components/DocsPage';
import {
  localize,
  CLI_DOC_DEFAULT_LOCALE,
  type CliDocLocale,
  type CliDocPage,
} from './content';
import { getCliDocBasePath, withCliDocBasePath } from './base';
import { cliDocsStyles } from './styles';

export interface CliDocsPageRenderer {
  renderHtmlDocument(): string;
}

export function createCliDocsPageApp(
  page: CliDocPage,
  pages: CliDocPage[],
  locale: CliDocLocale = CLI_DOC_DEFAULT_LOCALE
): CliDocsPageRenderer {
  const rootProps: DocsPageProps = { page, pages, locale };
  const body = {
    component: DocsPage as unknown as ComponentConstructor,
    props: rootProps,
  } satisfies VNode;

  return {
    renderHtmlDocument: () =>
      renderHtmlDocument({
        lang: locale === 'en' ? 'en' : 'zh-CN',
        htmlAttributes: {
          ...(getCliDocBasePath()
            ? { 'data-doc-base': getCliDocBasePath() }
            : {}),
        },
        title: `${localize(page.title, locale)} - TSone CLI`,
        description: localize(page.description, locale),
        body,
        styles: cliDocsStyles,
        scripts: [
          {
            type: 'module',
            src: withCliDocBasePath('/assets/cli-docs-client.js'),
          },
        ],
      }),
  };
}
