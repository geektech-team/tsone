import {
  callout,
  codeBlock,
  heading,
  inlineCode,
  list,
  paragraph,
  t,
  type CliDocPage,
} from './types';

export const gettingStartedPage: CliDocPage = {
  path: '/getting-started/',
  title: t('快速开始', 'Getting started'),
  description: t(
    '安装 TSone CLI，理解应用入口约定，并创建第一个项目。',
    'Install TSone CLI, understand the application entry contract, and scaffold the first project.'
  ),
  section: 'guide',
  sectionOrder: 1,
  order: 0,
  body: [
    heading(1, 'getting-started', t('快速开始', 'Getting started')),
    heading(2, 'install', t('安装', 'Installation')),
    paragraph(
      t(
        '在 Bun workspace 或独立项目中使用以下命令同时安装框架与 CLI：',
        'Install the framework and the CLI together with:'
      )
    ),
    codeBlock('bash', 'bun add @geektech/tsone @geektech/tsone-cli'),
    heading(2, 'entry', t('应用入口', 'Application entry')),
    paragraph(
      t(
        '默认入口是 src/main.ts。它必须具名导出 app，其值提供 renderHtmlDocument()；由 createApp 创建的 TSone 应用满足该约定：',
        'The default entry is src/main.ts. It must export a named app whose value provides renderHtmlDocument(); a TSone application created by createApp satisfies that contract:'
      )
    ),
    codeBlock(
      'ts',
      `import { Component, VNode, createApp } from '@geektech/tsone';

class App extends Component<object, object> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return { tag: 'main', children: ['Hello TSone'] };
  }
}

export const app = createApp({
  root: App,
  document: { title: 'TSone App' },
});

app.mount();`
    ),
    callout(
      'note',
      t('入口导出约定', 'Entry export contract'),
      [
        t(
          '导出必须写作 export const app；默认导出或其他名称不会被 CLI 使用。entry 是根页面：开发时在 / 提供，构建时输出为 index.html。',
          'The export must be written as export const app; a default export or another name is not used by the CLI. entry is the root page: it is served at / during development and built to index.html.'
        ),
      ]
    ),
    heading(2, 'create', t('创建项目', 'Create a project')),
    paragraph(
      t(
        'tsone create 在当前目录生成一个基础 TSone 项目：package.json、tsone.config.ts、tsconfig.json、.gitignore，以及一个展示 TSone 名称和框架仓库链接的 src/main.ts 首页。它拒绝覆盖已存在的文件。',
        'tsone create scaffolds a basic TSone project into the current directory: package.json, tsone.config.ts, tsconfig.json, .gitignore, and a src/main.ts homepage that shows the TSone name and a link to the framework GitHub repository. It refuses to overwrite existing files.'
      )
    ),
    codeBlock('bash', 'tsone create'),
    heading(2, 'dev-and-build', t('开发与构建', 'Dev and build')),
    paragraph(
      t('启动开发服务：', 'Start the development server:'),
      inlineCode('tsone dev'),
      t('；构建生产产物：', '; build production output:'),
      inlineCode('tsone build'),
      t('。详见命令参考。', '. See the commands reference.'),
    ),
  ],
};

export const commandsPage: CliDocPage = {
  path: '/commands/',
  title: t('命令参考', 'Commands'),
  description: t(
    'tsone create、dev 与 build 的用法、选项和行为。',
    'Usage, options and behavior of tsone create, dev and build.'
  ),
  section: 'guide',
  sectionOrder: 1,
  order: 1,
  body: [
    heading(1, 'commands', t('命令参考', 'Commands')),
    paragraph(
      t(
        '开发与构建选项刻意分开：create 不接受选项；dev 接受 --host、--port 与 --no-watch；build 只接受 --out-dir。选项覆盖 tsone.config.ts。分离写法与等号写法都可用，例如 --port 3000、--port=3000、--out-dir output、--out-dir=output。',
        'Development and build options are deliberately separate: create takes no options; dev accepts --host, --port, and --no-watch; build accepts only --out-dir. Options override tsone.config.ts. Both separated and equals forms work, for example --port 3000, --port=3000, --out-dir output, and --out-dir=output.'
      )
    ),
    codeBlock(
      'bash',
      `tsone create
tsone dev [--host <host>] [--port <port>] [--no-watch]
tsone build [--out-dir <path>]`
    ),
    heading(2, 'create', t('tsone create', 'tsone create')),
    paragraph(
      t(
        '在当前目录生成基础项目脚手架，不覆盖任何已存在文件。',
        'Scaffolds a basic project in the current directory without overwriting existing files.'
      )
    ),
    heading(2, 'dev', t('tsone dev', 'tsone dev')),
    paragraph(
      t(
        'tsone dev 默认监听项目：当源码、样式或配置文件变化时，它会重建当前页面，并通过 /__tsone/reload 的 server-sent events 流通知已连接的浏览器刷新。失败的构建会继续提供最后一个可用的页面；tsone.config.ts 的变更会以新配置重启开发服务器。传入 --no-watch 可关闭文件监听，让服务器退化为纯按需构建。',
        'tsone dev watches the project by default: when a source, style, or config file changes it rebuilds the current page and notifies connected browsers to reload over a server-sent events stream at /__tsone/reload. A failed rebuild keeps the last working page served, and changes to tsone.config.ts restart the development server with the fresh configuration. Pass --no-watch to disable file watching and keep the server as a plain on-demand builder.'
      )
    ),
    paragraph(
      t(
        '开发服务器在 / 与 /index.html 提供生成的 HTML，并为每个配置的页面提供一条路由。每个文档构建会在内部 .tsone/dev/ 目录下写入一个不可变的浏览器 ESM 产物代，并引用精确的 /dev/<session>/<generation>/... JavaScript 与样式表 URL。Bun 将该精确产物代 URL 用作公共路径，因此跨并发页面也能从文档 URL 正确解析文件资源。/bundle.js 保持为兼容别名：它重建并重定向到最新的根入口 URL。其他未匹配路径返回 404。.tsone/ 目录是工具生成的产物，可在开发服务器停止后删除；解析到项目外部的 .tsone 符号链接路径会在开发服务器启动前被拒绝。',
        'tsone dev serves the generated HTML at / and /index.html, plus one route per configured page. Each document build writes an immutable browser ESM generation beneath the internal .tsone/dev/ directory and references exact /dev/<session>/<generation>/... JavaScript and stylesheet URLs. Bun uses that exact generation URL as its public path, so emitted file-asset strings resolve correctly across concurrent pages. /bundle.js remains a compatibility alias that rebuilds and redirects to the latest root entry URL. Other unmatched paths return 404. The .tsone/ directory is generated tooling output and can be removed while the development server is stopped; a .tsone path that resolves outside the project through a symlink is rejected before the development server starts.'
      )
    ),
    heading(2, 'build', t('tsone build', 'tsone build')),
    paragraph(
      t(
        'tsone build 将 Bun 浏览器 bundle 与每个页面的 HTML 文档写入安全的输出目录。build.outDir 必须解析为项目根目录内的子目录：项目根本身、外部路径以及通过符号链接逃逸的路径都会在删除输出目录前被拒绝。',
        'tsone build writes a Bun browser bundle and one HTML document per page to the safe output directory. build.outDir must resolve to a child directory inside the project root: the project root itself, an outside path, and a path that escapes through a symlink are rejected before the output directory is removed.'
      )
    ),
    heading(2, 'multi-page', t('多页应用', 'Multi-page applications')),
    paragraph(
      t(
        '用 pages 选项为每个路由配置独立的页面入口，每个入口必须满足与 entry 相同的 app 约定。路由键必须以 / 开头且可嵌套；结尾斜杠会被归一化（/about/ 与 /about 同样生效）。根路由 / 不能在 pages 中重新定义——请用 entry。每条路由独立打包与渲染。',
        'Configure additional pages with the pages option, mapping each route to a page entry. Every page entry must satisfy the same app contract as entry. Route keys must start with / and may nest; trailing slashes are normalized (/about/ is served the same as /about). The root route / cannot be redefined in pages — use entry for it. Each route maps to its own entry, so every page bundles and renders independently.'
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
    paragraph(
      t(
        '开发时每个配置的页面在对应路由提供：/about/ 与 /about/index.html 也解析到 /about，且每个页面都有独立的 live-reload 注入。tsone build 为每个页面输出一份 HTML，使用页面路由作为文件名（/ 输出 index.html，/about 输出 about.html，/docs/guide 输出 docs/guide.html），资源 URL 相对该文档解析。',
        'During development each configured page is served at its route: /about/ and /about/index.html also resolve to /about, and every page receives its own live-reload injection. tsone build emits one HTML document per page, using the page route for the filename (index.html for /, about.html for /about, docs/guide.html for /docs/guide) with asset URLs relative to that document.'
      )
    ),
    heading(2, 'scope', t('v1 范围', 'Version 1 scope')),
    list([
      [
        t(
          '开发服务器仅提供 HTTP；代理目标可使用 HTTP 或 HTTPS。',
          'The development server serves HTTP only; proxy targets may use HTTP or HTTPS.'
        ),
      ],
      [
        t(
          'CLI v1 没有配置 plugins、WebSocket、HMR、SSR、函数式配置、public/ 目录复制，也没有公开的 minify 与 sourcemap 配置。',
          'CLI v1 has no config plugins, WebSocket, HMR, SSR, functional config, public/ directory copying, or public minify and sourcemap configuration.'
        ),
      ],
      [
        t(
          '开发 bundle 使用内部内联 source map；tsone build 默认压缩生产输出，压缩与 source map 控制刻意不可配置。',
          'Development bundles use an internal inline source map, while tsone build minifies production output by default; minification and source-map controls are intentionally not configurable.'
        ),
      ],
    ]),
  ],
};
