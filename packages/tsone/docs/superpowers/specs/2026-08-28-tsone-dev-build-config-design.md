# TSone 开发与构建配置设计

**日期：** 2026-08-28
**状态：** 已确认，待实施

## 背景

当前 `packages/tsone/scripts/dev.ts` 只认识仓库内置 playground，并通过
`--app` 在固定应用之间切换。外部项目无法通过发布工具启动同一套开发服务，
也没有类似 Vite `vite.config.ts` 的项目级配置入口。现有
`scripts/playground-build.ts` 同样是仓库内部脚本，开发与构建之间的入口解析、
HTML 生成和 Bun bundle 配置没有形成公开契约。

本次改动新增独立的 `@geektech/tsone-cli` 包，把这些能力整理成 Bun 原生、可发布的
TSone 工具链。外部项目可以用
`tsone dev` 启动开发服务，用 `tsone build` 构建静态产物，并通过项目根目录下的
`tsone.config.ts` 配置入口、HTTP 代理和输出目录。

## 目标

- 发布 `@geektech/tsone-cli` 包，提供有类型的配置与程序化 API。
- 由该包发布 `tsone` CLI，首版支持 `tsone dev` 和 `tsone build`。
- 自动加载当前项目根目录中的 `tsone.config.ts`。
- 让开发服务支持 Vite 风格的 `server.proxy` HTTP/HTTPS 转发配置。
- 让开发与构建共享项目根目录、入口解析和 HTML 生成规则。
- 将现有两个 playground 迁移成真实的外部消费者示例。
- 保持 `@geektech/tsone` 浏览器框架包零外部运行时依赖，不给它增加 dev export；
  CLI 包的 Bun 产物内置打包现有 Happy DOM，外部项目不需要单独安装它。

## 非目标

首版不实现以下能力：

- dev plugins 或 Bun build plugins 配置
- WebSocket 代理
- HMR
- `public/` 目录复制
- SSR
- devtools
- minify、sourcemap 等更多构建选项
- JavaScript、JSON 或函数式配置文件

应用运行时的 `app.use()` 插件协议不受本次改动影响。

## 使用方式

外部项目的脚本如下：

```json
{
  "scripts": {
    "dev": "tsone dev",
    "build": "tsone build"
  }
}
```

项目根目录可以创建配置文件：

```ts
import { defineConfig } from '@geektech/tsone-cli';

export default defineConfig({
  entry: 'src/main.ts',
  server: {
    host: '127.0.0.1',
    port: 52211,
    proxy: {
      '/api': 'http://localhost:3000',
      '/admin': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/admin/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
```

入口模块必须导出 TSone 应用实例：

```ts
export const app = createApp({
  root: App,
  document: {
    title: 'My TSone App',
  },
});

app.mount();
```

在 Bun 进程中加载入口前，工具链安装隔离的 Happy DOM 环境，使入口中的
`app.mount()` 和后续 `app.renderHtmlDocument()` 使用与现有文档生成能力相同的 DOM
契约。浏览器 bundle 执行同一入口后会在真实浏览器中正常挂载应用。

## 公共配置契约

`@geektech/tsone-cli` 公开以下配置形状：

```ts
export interface UserConfig {
  entry?: string;
  server?: ServerConfig;
  build?: BuildConfig;
}

export interface ServerConfig {
  host?: string;
  port?: number;
  proxy?: Record<string, string | ProxyOptions>;
}

export interface ProxyOptions {
  target: string;
  changeOrigin?: boolean;
  rewrite?: (path: string) => string;
}

export interface BuildConfig {
  outDir?: string;
}
```

默认值为：

- `entry`: `src/main.ts`
- `server.host`: `127.0.0.1`
- `server.port`: `52211`
- `server.proxy`: `{}`
- `build.outDir`: `dist`

`defineConfig(config)` 是保留输入对象的类型辅助函数，不在定义阶段访问文件系统，
也不启动服务或构建。

配置文件规则：

- 只自动识别项目根目录中的 `tsone.config.ts`。
- 配置文件必须使用默认导出，默认导出必须是普通配置对象。
- 未找到配置文件时使用默认配置。
- `entry` 和 `build.outDir` 相对项目根目录解析。
- 代理键必须以 `/` 开头，target 必须是有效的 HTTP 或 HTTPS URL。
- 配置错误在服务绑定端口或清理构建目录之前失败。

配置优先级从低到高为：默认值、`tsone.config.ts`、程序化参数或 CLI 参数。
`tsone dev` 支持 `--host` 和 `--port`，`tsone build` 支持 `--out-dir`。

## 程序化 API

`@geektech/tsone-cli` 公开：

```ts
export function defineConfig(config: UserConfig): UserConfig;

export function startDevServer(
  options?: StartDevServerOptions
): Promise<ReturnType<typeof Bun.serve>>;

export function build(options?: BuildOptions): Promise<BuildResult>;
```

程序化 options 支持指定：

- `root`：项目根目录，默认 `process.cwd()`。
- `config`：直接提供配置对象；提供后不读取磁盘配置文件。
- dev 的 `host`、`port` 或 build 的 `outDir`：作为最高优先级覆盖项。

`BuildResult` 返回解析后的项目根目录、输出目录和生成文件路径，方便测试和外部
工具继续处理产物。

## 模块边界

公开实现位于 `packages/tsone-cli/src/`，按职责拆分：

- 配置模块：定义类型、加载配置并解析默认值和相对路径。
- 项目入口模块：安装隔离的 DOM 环境、加载入口、校验 `app` 导出并生成 HTML。
- 代理模块：匹配规则、构造上游请求并处理失败。
- 开发服务模块：组合配置、入口渲染、bundle 和代理处理。
- 构建模块：清理安全的输出目录、执行 Bun build、写入 HTML。
- CLI 模块：解析命令和覆盖参数，调用公开服务。

`packages/tsone-cli/bin/tsone.ts` 是唯一 bin 启动器：在 monorepo fresh clone 中
尚无 `dist` 时调用 `src/cli.ts`，在发布包中调用已经构建的 `dist/cli.js`。因此仓库内
playground 不需要先构建 CLI 包，安装后的外部项目仍执行固定的发布产物。

CLI 包单独以 Bun 为目标构建 `dist/index.js`、`dist/cli.js` 和声明文件，并把现有
Happy DOM 打包进产物，不把它暴露成外部项目必须安装的 peer dependency。DOM 环境
的安装和清理由项目入口模块负责，避免配置加载、代理和 CLI 依赖 DOM 全局对象。
`@geektech/tsone` 继续沿用自己的 browser target 构建，两个包的发布面互不混合。

这些模块是依赖关系而不是继承关系：CLI 依赖配置、开发服务和构建服务；开发服务
组合入口渲染与代理处理器；构建服务组合入口渲染与 Bun bundler。各模块通过窄接口
协作，不给运行时 `OneApp` 增加工具链职责，符合单一职责和依赖倒置原则。

## 开发服务流程

1. 确定项目根目录并加载或接收配置。
2. 合并默认值、配置和程序化/CLI 覆盖项。
3. 校验配置、入口文件和代理规则。
4. 安装隔离的 Happy DOM 环境，加载入口模块并校验命名导出 `app` 及其
   `renderHtmlDocument()` 能力。
5. 在该 DOM 环境中生成引用 `/bundle.js` 的 HTML 文档，随后清理临时全局对象。
6. 成功完成以上步骤后才调用 `Bun.serve()` 绑定端口。
7. 请求先经过代理匹配；未匹配代理时再处理 `/`、`/index.html` 和
   `/bundle.js`。

开发 bundle 使用 browser target、ES module、inline sourcemap、禁用写盘和缓存。
其他路径返回 `404`。

## HTTP 代理语义

代理只支持 HTTP 和 HTTPS：

- 对所有以配置键开头的路径进行匹配；同时命中时选择最长前缀。
- string 写法等价于 `{ target: string }`。
- `rewrite` 接收请求 pathname；返回值作为上游 pathname，原查询参数保持不变。
- 未配置 `rewrite` 时保留原 pathname。
- 保留请求方法、请求体、查询参数和端到端请求头。
- 不转发 hop-by-hop headers。
- `changeOrigin` 默认为 `false`；为 `true` 时将 `Host` 改为 target host。
- 将客户端取消信号传递给上游 fetch。
- 保留上游响应状态、端到端响应头和响应 body。
- 无法连接上游时返回状态码 `502` 和不泄露内部堆栈的错误文本。

代理在 TSone 自有路由前执行，因此配置 `/bundle.js` 或 `/` 会明确覆盖开发服务的
同名路由。

## 构建流程

1. 按开发服务相同规则加载和校验配置及入口。
2. 解析输出目录并确认它是项目根目录内的子目录，拒绝项目根目录本身或外部路径。
3. 清理输出目录并重新创建。
4. 使用 Bun build 生成 browser target、ES module 的 JS、CSS 和导入资源。
5. 根据 Bun 输出生成 `index.html`，注入入口脚本及生成的样式链接。
6. 返回 `BuildResult`。

首版不复制 `public/`，不开放 minify 或 sourcemap 配置。构建失败时收集 Bun 日志并
抛出带上下文的错误；不会通过写入占位文件伪造成功。

## CLI 行为

CLI 只接受两个命令：

- `tsone dev [--host <host>] [--port <port>]`
- `tsone build [--out-dir <path>]`

未知命令、缺少参数、非法端口或未知 option 均输出用法并以非零状态退出。开发服务
启动后输出实际监听 URL；构建成功后输出产物数量和输出目录。内部 playground 的
package scripts 使用同一安装后的 bin，不再引用仓库脚本路径或传递 `--app`。

## 错误处理

以下错误必须包含可操作上下文，并在产生外部副作用前失败：

- 配置文件无法导入或没有有效默认导出
- entry 不存在
- entry 没有导出可渲染的 `app`
- host、port、代理前缀或代理 target 无效
- build outDir 不安全

运行期上游代理失败转换成 `502`，单次代理失败不关闭开发服务。bundle 构建失败返回
`500`，并在服务端记录 Bun 提供的构建诊断。

## 发布与迁移

新增 `packages/tsone-cli` workspace，包名为 `@geektech/tsone-cli`。它需要：

- 依赖 workspace 中的 `@geektech/tsone`，发布时使用框架包的真实版本范围。
- 根 export 指向 Bun 运行时 `dist/index.js` 和声明文件。
- `tsone` bin 指向随包发布的 `bin/tsone.ts` 启动器。
- 独立构建 Bun 目标的 public API 和 CLI 产物，并内置 Happy DOM。
- 包含自己的 package manifest、TypeScript 配置、构建脚本、README 和 LICENSE。
- package smoke test 验证 tarball 中的 public API、类型、bin 和已安装外部项目。

`@geektech/tsone` 的 exports、browser 构建和依赖边界保持不变，不新增 `./dev`。

两个 playground 分别增加对 `@geektech/tsone-cli` 的 workspace dev dependency 和
`tsone.config.ts`。它们保留自己的 `src/main.ts` 与 `app` 导出，并把脚本改成
`tsone dev`、`tsone build`。原有按名称维护的 `PLAYGROUND_APPS`、`--app` 解析和
固定仓库路径不再属于开发服务。

英文 README、中文 README 和 typed docs 同步说明：安装、脚本、配置字段、代理示例、
入口 `app` 导出约定、程序化 API 和首版限制。

## 测试策略

实现采用 TDD，每个行为先由失败测试定义：

- CLI 包配置单元测试：默认值、磁盘加载、直接配置、相对路径、覆盖优先级和非法输入。
- 代理集成测试：使用真实 `Bun.serve()` 上游验证最长前缀、rewrite、query、方法、
  body、`changeOrigin`、响应透传和 `502`。
- dev 集成测试：临时外部项目通过程序化 API 和安装后的 `tsone dev` 提供 HTML 与
  bundle。
- build 集成测试：临时项目执行 `tsone build`，验证安全清理和完整静态产物。
- CLI 测试：命令分发、参数覆盖和错误退出状态。
- CLI package smoke test：打包安装后验证 `@geektech/tsone-cli` 的运行时导出、
  类型声明以及 `tsone` bin 的 dev/build 能力。
- playground 测试：两个迁移后的项目仍能开发启动、构建和类型检查。

完成前运行相关测试、全量 `bun test`、`bunx tsc --noEmit`、两个包的 build，以及
`bun pm pack --cwd packages/tsone-cli --dry-run`。框架包的现有 build 和 package
smoke test 也必须保持通过。已存在且与本任务无关的基线失败会单独报告，不通过扩大
修改范围来掩盖。
