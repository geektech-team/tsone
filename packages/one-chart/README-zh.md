# One Chart

One Chart（`@geektech/one-chart`）是面向 TSone 类组件框架的轻量级 SVG 图表库。
所有图表仅以 SVG 渲染，浏览器运行时零外部依赖。

**文档：** <https://github.com/geektech-team/tsone/tree/main/packages/one-chart>

## 图表

- `OneBarChart` —— 分组 / 横向 / 堆叠柱状图
- `OneLineChart` —— 直线或平滑曲线，可选面积填充与数据点
- `OnePieChart` —— 比例扇区、环形图与百分比标签
- `OneRadarChart` —— 多指标对比，带网格环
- `OneScatterChart` —— 双数值轴散点，支持多系列叠加
- `OneFunnelChart` —— 梯形漏斗与逐级转化率

## 安装

```bash
bun add @geektech/tsone @geektech/one-chart
```

## 快速开始

```ts
import { OneBarChart } from '@geektech/one-chart';

const chart = new OneBarChart({
  title: '季度销量',
  categories: ['Q1', 'Q2', 'Q3', 'Q4'],
  series: [
    { name: '华东', data: [120, 200, 150, 280] },
    { name: '华南', data: [80, 110, 130, 160] },
  ],
  showValues: true,
});

chart.mount(document.querySelector('#app')!);
```

## 特性

- **纯 SVG 渲染** —— 无 Canvas、无第三方渲染依赖。
- **面向对象 API** —— 图表组件继承 TSone 的 `Component`，生命周期、属性与
  响应式更新与框架一致：

  ```ts
  chart.setProps({
    categories: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'],
    series: [{ name: '华东', data: [1, 2, 3, 4, 5] }],
  });
  ```

- **开箱即用的基础能力** —— 标题、图例、坐标轴、网格线与数值标签随每个图表
  提供，调色板与边距均可配置。
- **交互 tooltip** —— 悬停柱子、数据点或扇区即显示数值提示，默认开启，可用
  `tooltip: false` 关闭或传入 `formatter` 自定义内容；折线图与雷达图内置
  不可见热区，无需开启 `showPoints` 即可命中。
- **内置动画** —— 默认开启，基于原生 SVG SMIL 实现（无逐帧 JS）：首次挂载
  时图形从起点形态生长出现；数据变更时从旧几何过渡到新几何；`width` /
  `height` 变更时 SVG 根节点平滑缩放。可用 `animation` 属性关闭或调节：
  `animation: false` 或 `{ duration: 800, easing: 'easeInOut' }`；初始化 /
  数据变更 / 容器大小变更三类动画（`init` / `update` / `resize`）可分别
  开关，并遵循系统「减少动态效果」设置。
- **数据校验** —— 分类与系列长度不一致、数值非有限、饼图空数据或非正值等
  会在渲染时抛出 `OneChartDataError`。

## 通用属性

所有图表共享 `width` / `height`（默认 `640 × 400`）、`title`、`margin`、
`colors`（默认 Tableau 10 调色板）、`showLegend`、`ariaLabel`、`tooltip`
（默认开启，可传 `{ formatter }` 自定义内容）与 `animation`（默认开启，
传 `false` 关闭，或传对象配置时长、缓动与各类动画开关）。

## 开发

```bash
bun install
bun test            # 运行测试
bun run build       # 库构建（tsone build --library）
bun run docs        # 文档开发服务
bun run docs:build  # 文档静态构建
```

## License

MIT
