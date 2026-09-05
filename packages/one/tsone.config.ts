import { defineConfig } from '@geektech/tsone-cli';
import { oneDocPages, ONE_DOC_LOCALES } from './docs/app/content';

// One UI 文档是「多语言 × 多页面」的静态站：每个 (locale, page) 是一个独立路由，
// 全部共享同一个数据驱动入口 docs/app/entry.ts（由入口按当前 URL 解析渲染哪页）。
const pages: Record<string, string> = {};
for (const locale of ONE_DOC_LOCALES) {
  for (const page of oneDocPages) {
    const route =
      `/${locale}${page.path}`.replace(/\/+$/, '') || `/${locale}`;
    pages[route] = 'docs/app/entry.ts';
  }
}

export default defineConfig({
  entry: 'docs/app/entry.ts',
  pages,
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  build: {
    outDir: 'docs/dist',
    // 部署在子路径时（如 GitHub Pages 的 /tsone/one/）用 TSONE_BASE_PATH 覆盖。
    basePath: process.env.TSONE_BASE_PATH ?? '',
    directoryPages: true,
  },
  // npm 库打包：`tsone build --library` 使用，产出 dist/ 的 ESM bundle 与 .d.ts。
  // 先编译框架 tsone 的类型声明（one 的 tsconfig.build.json 经 paths 引用其产物）。
  library: {
    entry: 'lib/index.ts',
    external: ['@geektech/tsone', '@geektech/tsone/style'],
    tsconfigs: ['../tsone/tsconfig.build.json', 'tsconfig.build.json'],
  },
});
