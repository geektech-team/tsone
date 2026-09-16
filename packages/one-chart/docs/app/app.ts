import {
  renderHtmlDocument,
  type AppDocumentRenderOptions,
  type ComponentConstructor,
  type VNode,
} from '@geektech/tsone';
import { DocsPage, type DocsPageProps } from './components/DocsPage';
import {
  localize,
  ONE_CHART_DOC_DEFAULT_LOCALE,
  type OneChartDocLocale,
  type OneChartDocPage,
} from './content';
import { getOneChartDocBasePath } from './base';
import { oneChartDocsStyles } from './styles';
import { ONE_CHART_DOCS_THEME_KEY } from './theme';

export interface OneChartDocsPageRenderer {
  renderHtmlDocument(options?: AppDocumentRenderOptions): string;
}

const ONE_CHART_DOCS_THEME_BOOTSTRAP = `<script>
(function () {
  var theme = 'default';
  try {
    theme = localStorage.getItem('${ONE_CHART_DOCS_THEME_KEY}') || 'default';
  } catch (error) {
    // 存储不可用（隐私模式等）时保持默认主题。
  }
  if (theme !== 'dark') {
    theme = 'default';
  }
  document.documentElement.setAttribute('data-one-chart-theme', theme);
})();
</script>`;

export function createOneChartDocsPageApp(
  page: OneChartDocPage,
  pages: OneChartDocPage[],
  locale: OneChartDocLocale = ONE_CHART_DOC_DEFAULT_LOCALE
): OneChartDocsPageRenderer {
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
            'data-one-chart-theme': 'default',
            ...(getOneChartDocBasePath()
              ? { 'data-doc-base': getOneChartDocBasePath() }
              : {}),
          },
          title: `${localize(page.title, locale)} - One Chart`,
          description: localize(page.description, locale),
          body,
          styles: oneChartDocsStyles,
          head: options.head,
          scripts: options.scripts,
        })
      ),
  };
}

function injectThemeBootstrap(html: string): string {
  return html.replace('</head>', `${ONE_CHART_DOCS_THEME_BOOTSTRAP}\n  </head>`);
}
