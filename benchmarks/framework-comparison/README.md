# TSone × Vue × React 框架对比实验

同一份待办列表应用，分别用 TSone、Vue 3、React 实现，对比**产物体积**与**渲染性能**。
实验脚本与结果均可复现，详细结论见 TSone 文档的「基准测试」章节
（`packages/tsone/docs/app/content/{zh,en}/benchmark.ts`）。

## 目录结构

```
benchmarks/framework-comparison/
├── tsone/src/main.ts     # TSone 实现（类组件 + h/each）
├── vue/src/main.ts       # Vue 3 实现（Composition API + h 渲染函数）
├── react/src/main.ts     # React 19 实现（函数组件 + createElement）
├── shell.html            # 三套应用共用的 HTML 外壳（含 __t0 起点标记）
├── bench-driver.js       # 共用基准驱动（MutationObserver 计时，不属于被测框架）
├── runner.ts             # 构建 + 体积统计 + 浏览器基准 一体化运行器
└── results.json          # 最近一次运行的完整原始结果
```

## 被测功能（三套应用完全一致）

- 初始挂载 1000 条待办（`Task 0` ~ `Task 999`）
- 列表行：复选框（切换完成态）、标题（完成划线）、删除按钮
- 底部统计：总条数 / 未完成数

## 指标与方法

### 产物体积

三套应用均使用 **Bun 1.4.0 的 `Bun.build`** 生产配置构建（`target: 'browser'`、
`format: 'esm'`、`minify: true`、单入口），React 额外注入
`process.env.NODE_ENV = "production"`。统计入口 `main.js` 的原始字节、
gzip（zlib level 9）与 brotli 体积。Vue 产物为 runtime-only（不含模板编译器，
等价于 SFC 预编译后的打包结果）。

### 渲染性能

真实浏览器（系统 Chrome headless，通过 playwright-core 驱动）加载本地静态服务，
每个框架跑 **3 轮 × 5 次**，取中位数：

- **挂载耗时**：从 HTML `<head>` 内联脚本记录 `performance.now()` 起点，
  到应用首次渲染完成（`window.__mountMs`）的间隔，包含模块加载、框架初始化与首屏渲染。
- **更新耗时**：`timeOp(fn)` 以调用前为起点，以 **DOM 最后一次变更时刻** 为终点
  （MutationObserver 记录时间戳，待 50ms 无新变更判定提交完成），
  不依赖 rAF 帧等待，跨框架口径统一。
  - `add1000`：追加 1000 条（Vue 循环 push / React 函数式更新 / TSone 整体重赋值，均单次提交）
  - `toggle1000`：切换前 1000 条完成态（Vue 循环改深层响应式 / React map / TSone map 重赋值）
  - `remove1000`：删除前 1000 条
  - `toggleEach1000`：逐条切换 1000 次（每次一条独立状态更新，
    用于观察框架的**批处理**行为：Vue/React 自动合并为一次渲染，TSone 当前同步逐次渲染）

## 复现

```bash
cd benchmarks/framework-comparison
bun install        # 安装 vue / react / playwright-core
bun bench          # 构建 + 体积统计 + 浏览器基准，结果写入 results.json
bun runner.ts --build-only   # 只构建和统计体积，不跑浏览器
```

前置条件：macOS 上的系统 Chrome（默认路径
`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`），
如需换浏览器修改 `runner.ts` 中的 `CHROME_PATH`。

## 环境记录（最近一次运行）

见 `results.json` 中的 `environment` 字段：Bun 版本、Chrome 版本、
Vue/React/playwright-core 版本、轮数与迭代数。
