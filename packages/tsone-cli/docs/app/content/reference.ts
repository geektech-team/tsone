import {
  apiTable,
  callout,
  codeBlock,
  heading,
  paragraph,
  t,
  type CliDocPage,
} from './types';

export const apiPage: CliDocPage = {
  path: '/api/',
  title: t('编程式 API', 'Programmatic API'),
  description: t(
    '所有工具 API 都来自 @geektech/tsone-cli：配置解析、开发服务器、构建与脚手架。',
    'All tooling APIs come from @geektech/tsone-cli: config resolution, dev server, build and scaffolding.'
  ),
  section: 'reference',
  sectionOrder: 2,
  order: 0,
  body: [
    heading(1, 'api', t('编程式 API', 'Programmatic API')),
    paragraph(
      t(
        '所有工具 API 都来自 @geektech/tsone-cli，而不是框架根导出：',
        'All tooling APIs come from @geektech/tsone-cli, not from the framework root:'
      )
    ),
    codeBlock(
      'ts',
      `import {
  build,
  createProject,
  defineConfig,
  resolveConfig,
  startDevServer,
} from '@geektech/tsone-cli';

const config = defineConfig({ build: { outDir: 'output' } });
const resolved = await resolveConfig({ root: process.cwd(), config });
const server = await startDevServer({ root: resolved.root, port: 0 });

try {
  console.log(server.url);
} finally {
  server.stop();
}

const result = await build({ root: resolved.root, outDir: 'release' });
console.log(result.root, result.outDir, result.assetsBuilt);`
    ),
    heading(2, 'functions', t('函数', 'Functions')),
    apiTable(t('编程式 API', 'Programmatic API'), [
      {
        name: 'defineConfig',
        signature: '(config: UserConfig) => UserConfig',
        description: t(
          '返回相同的类型化配置对象。',
          'Returns the same typed config object.'
        ),
      },
      {
        name: 'resolveConfig',
        signature: '(options?) => Promise<ResolvedConfig>',
        description: t(
          '校验并合并默认值、配置文件、直接配置与 host/port/outDir 覆盖。返回绝对 root、entry 与 build.outDir 值、解析后的 pages 路由映射，以及解析后的服务器配置。',
          'Validates and merges defaults, a config file, direct config, and host/port/outDir overrides. It returns absolute root, entry, and build.outDir values, the resolved pages route map, plus the resolved server configuration.'
        ),
      },
      {
        name: 'startDevServer',
        signature: '(options?) => Promise<Server>',
        description: t(
          '解析配置并返回 Bun 服务器。调用方拥有其生命周期，必须调用 server.stop()。',
          'Resolves the configuration and returns the Bun server. The caller owns its lifecycle and must call server.stop().'
        ),
      },
      {
        name: 'build',
        signature: '(options?) => Promise<BuildResult>',
        description: t(
          '校验入口与输出路径，然后返回 { root, outDir, assetsBuilt }；结果中的路径为绝对路径。',
          'Validates the entry and output path, then returns { root, outDir, assetsBuilt }; the paths in the result are absolute.'
        ),
      },
      {
        name: 'createProject',
        signature: '(options?) => Promise<CreateProjectResult>',
        description: t(
          '将基础 TSone 脚手架写入 options.root（默认为当前工作目录）并返回 { root, files }；拒绝覆盖已存在的文件。',
          'Writes a basic TSone scaffold into options.root (defaults to the current working directory) and returns { root, files }; it refuses to overwrite existing files.'
        ),
      },
    ]),
    callout(
      'tip',
      t('生命周期约定', 'Lifecycle contract'),
      [
        t(
          'startDevServer 返回的服务器由调用方管理：确保在进程退出前调用 server.stop()。build 与 resolveConfig 是纯异步函数，返回后不保留任何后台资源。',
          'The server returned by startDevServer is owned by the caller: make sure server.stop() is called before the process exits. build and resolveConfig are plain async functions that keep no background resources after they resolve.'
        ),
      ]
    ),
    heading(2, 'types', t('公开类型', 'Public types')),
    paragraph(
      t(
        '从包入口同时导出以下类型：BuildOptions、BuildResult、BuildConfig、ProxyOptions、ResolveConfigOptions、ResolvedConfig、ServerConfig、UserConfig，以及 CreateProjectOptions、CreateProjectResult。',
        'The package entry also exports these types: BuildOptions, BuildResult, BuildConfig, ProxyOptions, ResolveConfigOptions, ResolvedConfig, ServerConfig, UserConfig, plus CreateProjectOptions, CreateProjectResult.'
      )
    ),
  ],
};
