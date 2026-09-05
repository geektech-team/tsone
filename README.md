# TSone Monorepo

TSone 是一套完全基于 TypeScript 与 Bun 的前端生态：轻量级框架 `@geektech/tsone`、纯 TS 组件库 `@geektech/one`，以及统一驱动站点开发与库打包的 CLI `@geektech/tsone-cli`。

> 子包 README 提供中英双语（`packages/*/README.md` 与 `README-zh.md`），根 README 当前为中文。

## 仓库结构

| 包 | 目录 | 版本 | 说明 |
|---|---|---|---|
| `@geektech/tsone` | `packages/tsone` | 0.3.0 | 轻量级前端框架：响应式系统、类组件、策略化渲染、内置路由 |
| `@geektech/one` | `packages/one` | 0.3.3 | One UI 组件库，peer 依赖 `@geektech/tsone`，零额外运行时依赖 |
| `@geektech/tsone-cli` | `packages/tsone-cli` | 0.3.0 | Bun-native CLI：`tsone create` / `dev` / `build`，含 npm 库打包模式 |

其他目录：

- `playground/` — 示例应用（`official-site`、`admin-dashboard`、`demo`），可直接 `bun run dev:site` 等启动
- `docs/`、`benchmarks/` — 内部文档与基准测试
- `scripts/release.ts` — 发布脚本（`bun run release`）

## 特性

- **纯 TypeScript、零生产依赖**：框架、组件库、CLI 均无外部运行时依赖
- **Bun-native 工具链**：workspace、测试（`bun test`）、构建、文档站全部基于 Bun
- **CLI 统一驱动**：文档站开发/构建走 `tsone dev` / `tsone build`，npm 库打包走 `tsone build --library`（由 `tsone.config.ts` 的 `library` 块配置 entry、external、tsconfigs 等），不再需要各包自建脚本

## 快速开始

安装框架与 CLI：

```bash
bun add @geektech/tsone @geektech/tsone-cli
```

用 CLI 脚手架新建项目：

```bash
tsone create
tsone dev        # 开发，默认 http://127.0.0.1:52211
tsone build      # 站点构建
```

如果只想先跑起来看看，仓库自带 playground：

```bash
bun install
bun run dev:site
```

## 常用命令

在仓库根目录执行：

| 命令 | 作用 |
|---|---|
| `bun install` | 安装 workspace 依赖 |
| `bun run build` | 全量构建：tsone → one → tsone-cli |
| `bun run build:one` | 仅构建 One UI 库（`tsone build --library`） |
| `bun run build:types` | 构建 tsone / tsone-cli 的类型声明 |
| `bun run test` | 全仓测试（`bun test`） |
| `bun run lint` / `bun run format` | 代码检查 / 格式化 |
| `bun run docs` / `bun run docs:build` | 框架文档站开发 / 构建 |
| `bun run docs:one` / `bun run docs:one:build` | One UI 文档站开发 / 构建 |
| `bun run docs:cli` / `bun run docs:cli:build` | CLI 文档站开发 / 构建 |
| `bun run dev:site` / `bun run dev:admin` | playground 站点 / 后台示例 |
| `bun run release` | 发布所有包（`scripts/release.ts`） |

各包内的常用脚本：

```bash
cd packages/tsone
bun run build        # 框架库打包（Bun.build + .d.ts）
bun test
bun run docs         # 框架文档站

cd packages/one
bun run build        # 组件库打包（= tsone build --library）
bun test
bun run docs         # 组件文档站（= tsone dev）

cd packages/tsone-cli
bun run build        # 构建 CLI dist
bun test
```

要求 Bun `>=1.3.0`。

## 文档

- TSone 框架文档：<https://geektech-team.github.io/tsone/>
- One UI 文档：<https://geektech-team.github.io/tsone/one/>
- CLI 文档：<https://geektech-team.github.io/tsone/cli/>

子包 README（含中英双语）：

- [TSone 框架](packages/tsone/README.md)
- [One UI 组件库](packages/one/README.md)
- [TSone CLI](packages/tsone-cli/README.md)

## 贡献

欢迎提交 Issue 与 Pull Request。发布前请确保测试、类型检查与构建全部通过：

```bash
bun test
bunx tsc --noEmit
bun run build
```

## 许可证

[MIT](https://github.com/geektech-team/tsone/blob/main/packages/tsone/LICENSE)
