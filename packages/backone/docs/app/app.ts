import {
  renderHtmlDocument,
  type AppDocumentRenderOptions,
  type ComponentConstructor,
  type VNode,
} from '@geektech/tsone';
import { DocsPage, type DocsPageProps } from './components/DocsPage';
import {
  localize,
  BACKONE_DOC_DEFAULT_LOCALE,
  type BackOneDocLocale,
  type BackOneDocPage,
} from './content';
import { getBackOneDocBasePath } from './base';
import { backOneDocsStyles } from './styles';
import { BACKONE_DOCS_THEME_KEY } from './theme';

export interface BackOneDocsPageRenderer {
  renderHtmlDocument(options?: AppDocumentRenderOptions): string;
}

const BACKONE_DOCS_THEME_BOOTSTRAP = `<script>
(function () {
  var theme = 'default';
  try {
    theme = localStorage.getItem('${BACKONE_DOCS_THEME_KEY}') || 'default';
  } catch (error) {
    // 存储不可用（隐私模式等）时保持默认主题。
  }
  if (theme !== 'dark') {
    theme = 'default';
  }
  document.documentElement.setAttribute('data-backone-theme', theme);
})();
</script>`;

export function createBackOneDocsPageApp(
  page: BackOneDocPage,
  pages: BackOneDocPage[],
  locale: BackOneDocLocale = BACKONE_DOC_DEFAULT_LOCALE
): BackOneDocsPageRenderer {
  const rootProps: DocsPageProps = { page, pages, locale };
  const body = {
    component: DocsPage as unknown as ComponentConstructor,
    props: rootProps,
  } satisfies VNode;

  return {
    // 客户端 bundle 的 script/CSS 由 tsone-cli 构建时通过 options 注入，
    // 这里只负责文档自身的 SSR 骨架。
    renderHtmlDocument: (options = {}) =>
      injectThemeBootstrap(
        renderHtmlDocument({
          lang: locale === 'en' ? 'en' : 'zh-CN',
          htmlAttributes: {
            'data-backone-theme': 'default',
            ...(getBackOneDocBasePath()
              ? { 'data-doc-base': getBackOneDocBasePath() }
              : {}),
          },
          title: `${localize(page.title, locale)} - BackOne`,
          description: localize(page.description, locale),
          body,
          styles: backOneDocsStyles,
          head: options.head,
          scripts: options.scripts,
        })
      ),
  };
}

function injectThemeBootstrap(html: string): string {
  return html.replace('</head>', `${BACKONE_DOCS_THEME_BOOTSTRAP}\n  </head>`);
}
