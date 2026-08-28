import { createApp, type OneApp } from '@geektech/tsone';
import { DocsPage, type DocsPageProps } from './components/DocsPage';
import type { OneDocPage } from './content';
import { oneDocsStyles } from './styles';

export function createOneDocsPageApp(
  page: OneDocPage,
  pages: OneDocPage[]
): OneApp<object, object, DocsPageProps> {
  const rootProps = { page, pages };

  return createApp({
    root: DocsPage,
    rootProps,
    document: {
      lang: 'zh-CN',
      title: `${page.title} - One UI`,
      description: page.description,
      body: { component: DocsPage, props: { page, pages } },
      styles: oneDocsStyles,
      scripts: [{ type: 'module', src: '/assets/one-docs-client.js' }],
    },
  });
}
