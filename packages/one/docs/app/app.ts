import {
  renderHtmlDocument,
  type ComponentConstructor,
  type VNode,
} from '@geektech/tsone';
import { DocsPage, type DocsPageProps } from './components/DocsPage';
import {
  localize,
  ONE_DOC_DEFAULT_LOCALE,
  type OneDocLocale,
  type OneDocPage,
} from './content';
import { getOneDocBasePath, withOneDocBasePath } from './base';
import { oneDocsStyles } from './styles';
import { ONE_DOCS_THEME_KEY } from './theme';

export interface OneDocsPageRenderer {
  renderHtmlDocument(): string;
}

const ONE_DOCS_THEME_BOOTSTRAP = `<script>
(function () {
  var theme = 'default';
  try {
    theme = localStorage.getItem('${ONE_DOCS_THEME_KEY}') || 'default';
  } catch (error) {
    // 存储不可用（隐私模式等）时保持默认主题。
  }
  if (theme !== 'dark') {
    theme = 'default';
  }
  document.documentElement.setAttribute('data-one-theme', theme);
})();
</script>`;

export function createOneDocsPageApp(
  page: OneDocPage,
  pages: OneDocPage[],
  locale: OneDocLocale = ONE_DOC_DEFAULT_LOCALE
): OneDocsPageRenderer {
  const rootProps: DocsPageProps = { page, pages, locale };
  const body = {
    component: DocsPage as unknown as ComponentConstructor,
    props: rootProps,
  } satisfies VNode;

  return {
    renderHtmlDocument: () =>
      injectThemeBootstrap(
        renderHtmlDocument({
          lang: locale === 'en' ? 'en' : 'zh-CN',
          htmlAttributes: {
            'data-one-theme': 'default',
            ...(getOneDocBasePath()
              ? { 'data-doc-base': getOneDocBasePath() }
              : {}),
          },
          title: `${localize(page.title, locale)} - One UI`,
          description: localize(page.description, locale),
          body,
          styles: oneDocsStyles,
          scripts: [
            {
              type: 'module',
              src: withOneDocBasePath('/assets/one-docs-client.js'),
            },
          ],
        })
      ),
  };
}

function injectThemeBootstrap(html: string): string {
  return html.replace('</head>', `${ONE_DOCS_THEME_BOOTSTRAP}\n  </head>`);
}
