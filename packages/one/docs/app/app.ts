import {
  renderHtmlDocument,
  type ComponentConstructor,
  type VNode,
} from '@geektech/tsone';
import { DocsPage, type DocsPageProps } from './components/DocsPage';
import type { OneDocPage } from './content';
import { oneDocsStyles } from './styles';

export interface OneDocsPageRenderer {
  renderHtmlDocument(): string;
}

export function createOneDocsPageApp(
  page: OneDocPage,
  pages: OneDocPage[]
): OneDocsPageRenderer {
  const rootProps: DocsPageProps = { page, pages };
  const body = {
    component: DocsPage as unknown as ComponentConstructor,
    props: rootProps,
  } satisfies VNode;

  return {
    renderHtmlDocument: () =>
      renderHtmlDocument({
        lang: 'zh-CN',
        title: `${page.title} - One UI`,
        description: page.description,
        body,
        styles: oneDocsStyles,
        scripts: [{ type: 'module', src: '/assets/one-docs-client.js' }],
      }),
  };
}
