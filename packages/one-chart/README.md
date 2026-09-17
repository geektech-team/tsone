# One Chart

One Chart (`@geektech/one-chart`) is a lightweight SVG chart library for the
TSone class-component framework. Every chart renders purely as SVG with zero
external dependencies in the browser runtime.

**Documentation:** <https://github.com/geektech-team/tsone/tree/main/packages/one-chart>

## Charts

- `OneBarChart` — grouped / horizontal / stacked bars
- `OneLineChart` — linear or smooth curves, optional area fill and data points
- `OnePieChart` — proportional sectors, donut rings, percentage labels
- `OneRadarChart` — multi-indicator comparison with grid rings
- `OneScatterChart` — scatter on two numeric axes with multi-series overlay
- `OneFunnelChart` — trapezoid funnel with per-level conversion

## Installation

```bash
bun add @geektech/tsone @geektech/one-chart
```

## Quick start

```ts
import { OneBarChart } from '@geektech/one-chart';

const chart = new OneBarChart({
  title: 'Quarterly sales',
  categories: ['Q1', 'Q2', 'Q3', 'Q4'],
  series: [
    { name: 'East', data: [120, 200, 150, 280] },
    { name: 'South', data: [80, 110, 130, 160] },
  ],
  showValues: true,
});

chart.mount(document.querySelector('#app')!);
```

## Features

- **Pure SVG rendering** — no Canvas, no third-party rendering dependency.
- **Object-oriented API** — chart components extend TSone's `Component`, so
  lifecycle, props and reactive updates work as usual:

  ```ts
  chart.setProps({
    categories: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'],
    series: [{ name: 'East', data: [1, 2, 3, 4, 5] }],
  });
  ```

- **Built-in basics** — title, legend, axes, grid lines and value labels ship
  with every chart; palette and margins are configurable per chart.
- **Interactive tooltip** — hovering a bar, data point or sector shows its
  value; on by default, disable with `tooltip: false` or customize via a
  `formatter`. Line and radar charts ship invisible hit areas, so no
  `showPoints` is needed to hover.
- **Data validation** — invalid categories, series length mismatches,
  non-finite values, empty pie data or negative pie values throw
  `OneChartDataError` at render time.

## Common props

All charts share `width` / `height` (default `640 × 400`), `title`, `margin`,
`colors` (default Tableau 10 palette), `showLegend`, `ariaLabel` and `tooltip`
(on by default; pass `{ formatter }` to customize the content).

## Development

```bash
bun install
bun test            # run the test suite
bun run build       # library build (tsone build --library)
bun run docs        # docs dev server
bun run docs:build  # static docs build
```

## License

MIT
