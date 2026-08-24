# TSone Monorepo Migration Design

## Goal

把当前 TSone 单包仓库改造成 Bun-first monorepo，并把现有发布包完整迁入
`packages/tsone/`，作为 workspace 中的第一个包。

## Approved Approach

采用单 package workspace 方案：

- 根目录成为私有 workspace，只负责仓库级脚本、workspace 声明、共享开发依赖和
  lockfile。
- 现有 `@geektech/tsone` 包迁入 `packages/tsone/`，保留包名、版本、exports、
  发布配置、README、源码、测试、示例和文档系统。
- 根命令保持兼容：`bun test`、`bun run build`、`bun run dev`、
  `bun run docs`、`bun run docs:build` 仍从仓库根目录可用，并代理到
  `@geektech/tsone` workspace package。

## Directory Shape

迁移后的主要结构：

```text
package.json
bun.lock
AGENTS.md
packages/
  tsone/
    package.json
    tsconfig.json
    tsconfig.build.json
    bunfig.toml
    README.md
    LICENSE
    lib/
    scripts/
    tests/
    examples/
    docs/
    skills/
```

根 `package.json` 不作为发布包。`packages/tsone/package.json` 继续作为
`@geektech/tsone` 的发布合同，产物仍是包内 `dist/`、文档产物仍是包内
`docs/dist/`。

## Command Contract

根脚本代理到包内脚本，保留用户已习惯的命令含义：

- `bun test` 运行 TSone 包测试。
- `bun run build` 构建 `packages/tsone/dist`。
- `bun run dev` 启动 TSone 示例服务。
- `bun run docs` 启动 TSone 文档预览服务。
- `bun run docs:build` 生成 TSone 静态文档。
- `bunx tsc --noEmit` 在根目录执行时覆盖 workspace 包源码、文档、示例和脚本。

包内脚本仍按包目录作为当前工作目录运行，因此现有 `scripts/*.ts` 的相对路径语义
继续有效。

## Test And Documentation Updates

迁移要同步更新以下合同：

- 测试中的源码、脚本、文档、示例导入路径。
- 读取 `package.json`、`README.md`、`.gitignore` 的测试辅助函数。
- 仓库卫生测试，确保根和包内生成产物都不会被跟踪。
- README 和 typed docs 中关于文档内容位置、开发命令、发布前检查的说明。
- AGENTS.md 的代码地图和路径约定。

## Constraints

- 保持 Bun-first，不引入 pnpm/npm/Vite/Vitest 主路径。
- 运行时代码继续零外部运行时依赖。
- 保持公开包名 `@geektech/tsone`、显示名 `TSone`、版本 `0.0.1`。
- `bun run docs` 继续表示启动文档预览服务，不改成静态构建。
- 不提交生成产物、缓存、`node_modules`、`dist` 或 `docs/dist`。
