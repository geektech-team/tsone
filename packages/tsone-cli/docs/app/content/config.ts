import {
  apiTable,
  callout,
  codeBlock,
  heading,
  list,
  paragraph,
  t,
  type CliDocPage,
} from './types';

export const configPage: CliDocPage = {
  path: '/config/',
  title: t('配置', 'Configuration'),
  description: t(
    'tsone.config.ts、defineConfig、默认值、多页与 CLI 覆盖。',
    'tsone.config.ts, defineConfig, defaults, multi-page and CLI overrides.'
  ),
  section: 'guide',
  sectionOrder: 1,
  order: 2,
  body: [
    heading(1, 'config', t('配置', 'Configuration')),
    paragraph(
      t(
        '在项目根目录创建可选的 tsone.config.ts。配置文件只支持普通对象默认导出；不支持函数式或函数值配置。defineConfig() 提供类型检查而不改变对象本身。',
        'Create an optional tsone.config.ts in the project root. The config file supports only a plain-object default export; functional or function-valued config is not supported. defineConfig() supplies type checking without changing the object.'
      )
    ),
    codeBlock(
      'ts',
      `import { defineConfig } from '@geektech/tsone-cli';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\\/api/, ''),
      },
    },
  },
  build: { outDir: 'dist' },
});`
    ),
    heading(2, 'defaults', t('默认值', 'Defaults')),
    apiTable(t('配置默认值', 'Configuration defaults'), [
      {
        name: 'entry',
        signature: `'src/main.ts'`,
        description: t(
          '根页面入口文件。',
          'The root page entry file.'
        ),
      },
      {
        name: 'pages',
        signature: '{}',
        description: t(
          '无额外页面。',
          'No additional pages.'
        ),
      },
      {
        name: 'server.host',
        signature: `'127.0.0.1'`,
        description: t(
          '开发服务器监听地址。',
          'The dev server host.'
        ),
      },
      {
        name: 'server.port',
        signature: '52211',
        description: t(
          '开发服务器端口。',
          'The dev server port.'
        ),
      },
      {
        name: 'server.proxy',
        signature: '{}',
        description: t(
          '无代理规则。',
          'No proxy rules.'
        ),
      },
      {
        name: 'build.outDir',
        signature: `'dist'`,
        description: t(
          '构建输出目录。',
          'The build output directory.'
        ),
      },
    ]),
    callout(
      'note',
      t('输出目录安全', 'Output directory safety'),
      [
        t(
          'build.outDir 必须解析为项目根目录内的子目录。项目根本身、外部路径以及通过符号链接逃逸的路径都会在删除输出目录前被拒绝。',
          'build.outDir must resolve to a child directory inside the project root. The project root itself, an outside path, and a path that escapes through a symlink are rejected before the output directory is removed.'
        ),
      ]
    ),
    heading(2, 'multi-page', t('多页应用', 'Multi-page applications')),
    paragraph(
      t(
        '用 pages 选项为每条路由映射一个页面入口。路由键必须以 / 开头且可嵌套；结尾斜杠被归一化。根路由 / 不能在 pages 中重新定义——用 entry 表示它。',
        'Configure additional pages with the pages option, mapping each route to a page entry. Route keys must start with / and may nest; trailing slashes are normalized. The root route / cannot be redefined in pages — use entry for it.'
      )
    ),
    codeBlock(
      'ts',
      `import { defineConfig } from '@geektech/tsone-cli';

export default defineConfig({
  entry: 'src/main.ts',
  pages: {
    '/about': 'src/about.ts',
    '/docs/guide': 'src/guide.ts',
  },
});`
    ),
    heading(2, 'overrides', t('CLI 覆盖', 'CLI overrides')),
    paragraph(
      t(
        '命令行选项覆盖配置文件：dev 的 --host、--port、--no-watch 与 build 的 --out-dir。分离与等号写法均可。',
        'Command-line options override the config file: --host, --port, --no-watch for dev, and --out-dir for build. Both separated and equals forms work.'
      )
    ),
  ],
};

export const proxyPage: CliDocPage = {
  path: '/proxy/',
  title: t('开发代理', 'Development proxy'),
  description: t(
    '开发服务器的 HTTP/HTTPS 代理：规则匹配、选项与行为。',
    'The dev server HTTP/HTTPS proxy: rule matching, options and behavior.'
  ),
  section: 'guide',
  sectionOrder: 1,
  order: 3,
  body: [
    heading(1, 'proxy', t('开发代理', 'Development proxy')),
    paragraph(
      t(
        '开发服务器仅提供 HTTP。代理目标可使用 HTTP 或 HTTPS。规则按字面量路径前缀匹配，最长前缀优先。',
        'The development server serves HTTP only. Proxy targets may use HTTP or HTTPS. A rule is matched as a literal pathname prefix, and the longest matching prefix wins.'
      )
    ),
    codeBlock(
      'ts',
      `import { defineConfig } from '@geektech/tsone-cli';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\\/api/, ''),
      },
    },
  },
});`
    ),
    paragraph(
      t(
        '不需要其他选项时，代理也可以用字符串简写：',
        'A proxy can also use the string shorthand when no other options are needed:'
      )
    ),
    codeBlock(
      'ts',
      `export default defineConfig({
  server: {
    proxy: {
      '/backend': 'http://localhost:4000',
    },
  },
});`
    ),
    heading(2, 'behavior', t('行为', 'Behavior')),
    list([
      [
        t(
          '代理保留查询字符串、请求方法、请求体与端到端头部，同时移除逐跳（hop-by-hop）头部。',
          'The proxy preserves the query string, request method, request body, and end-to-end headers while removing hop-by-hop headers.'
        ),
      ],
      [
        t(
          'changeOrigin: true 会改写上游 Host 头部；否则保留传入的 Host。',
          'changeOrigin: true changes the upstream Host header; otherwise the incoming host is retained.'
        ),
      ],
      [
        t(
          'rewrite 在路径拼接到目标基础路径之前同步改写路径名。',
          'rewrite synchronously changes the pathname before it is joined to the target base path.'
        ),
      ],
      [
        t(
          '上游连接失败返回固定响应 502 Bad Gateway。',
          'An upstream connection failure returns the fixed response 502 Bad Gateway.'
        ),
      ],
    ]),
    heading(2, 'options', t('代理选项', 'Proxy options')),
    apiTable(t('ProxyOptions', 'ProxyOptions'), [
      {
        name: 'target',
        signature: 'string',
        description: t(
          '代理目标地址，HTTP 或 HTTPS。',
          'The proxy target address, HTTP or HTTPS.'
        ),
      },
      {
        name: 'changeOrigin',
        signature: 'boolean',
        description: t(
          '改写上游 Host 头部为 target 的主机。',
          'Changes the upstream Host header to the target host.'
        ),
      },
      {
        name: 'rewrite',
        signature: '(path: string) => string',
        description: t(
          '在拼接目标基础路径前同步改写路径名。',
          'Synchronously rewrites the pathname before joining to the target base path.'
        ),
      },
    ]),
  ],
};
