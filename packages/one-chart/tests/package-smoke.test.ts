import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'bun:test';

const oneChartRoot = join(import.meta.dir, '..');
const repositoryRoot = join(oneChartRoot, '..', '..');
const tsoneRoot = join(repositoryRoot, 'packages', 'tsone');
const require = createRequire(import.meta.url);
const tscBin = require.resolve('typescript/bin/tsc');

function createRunner(bunTemp: string, bunCache: string) {
  return function run(command: string, args: string[], cwd = oneChartRoot): string {
    try {
      return execFileSync(command, args, {
        cwd,
        env: {
          ...process.env,
          TMPDIR: bunTemp,
          BUN_INSTALL_CACHE_DIR: bunCache,
        },
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (error) {
      const output = error as {
        stdout?: Buffer | string;
        stderr?: Buffer | string;
        message?: string;
      };
      throw new Error(
        [output.message, output.stdout?.toString(), output.stderr?.toString()]
          .filter(Boolean)
          .join('\n')
      );
    }
  };
}

describe('One Chart package smoke', () => {
  it('packs an installable peer-based library with real ESM runtime and strict consumer types', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'one-chart-package-'));
    const bunTemp = join(tempDir, 'bun-tmp');
    const bunCache = join(tempDir, 'bun-cache');
    const run = createRunner(bunTemp, bunCache);

    try {
      mkdirSync(bunTemp, { recursive: true });
      mkdirSync(bunCache, { recursive: true });
      run('bun', ['run', 'build'], tsoneRoot);
      run('bun', ['run', 'build']);

      const chartBundle = readFileSync(
        join(oneChartRoot, 'dist', 'index.js'),
        'utf8'
      );
      // 库打包必须把 tsone 留在外部，由消费方提供。
      expect(chartBundle).toMatch(/from\s*["']@geektech\/tsone["']/);

      const tsoneManifest = JSON.parse(
        readFileSync(join(tsoneRoot, 'package.json'), 'utf8')
      ) as { name: string; version: string };
      const tsoneTarball = join(
        tempDir,
        `${tsoneManifest.name.replace('@', '').replace('/', '-')}-${tsoneManifest.version}.tgz`
      );
      const oneChartTarball = join(tempDir, 'geektech-one-chart-0.4.0.tgz');
      run(
        'bun',
        ['pm', 'pack', '--destination', tempDir, '--ignore-scripts', '--quiet'],
        tsoneRoot
      );
      run('bun', [
        'pm',
        'pack',
        '--destination',
        tempDir,
        '--ignore-scripts',
        '--quiet',
      ]);

      const packageFiles = run('tar', ['-tzf', oneChartTarball])
        .split('\n')
        .filter(Boolean)
        .map((file) => file.replace(/^package\//, ''));

      expect(packageFiles).toEqual(
        expect.arrayContaining([
          'dist/index.js',
          'dist/index.d.ts',
          'README.md',
          'README-zh.md',
          'LICENSE',
          'package.json',
        ])
      );
      expect(packageFiles.some((file) => file.startsWith('lib/'))).toBe(false);
      expect(packageFiles.some((file) => file.startsWith('tests/'))).toBe(
        false
      );
      expect(packageFiles.some((file) => file.startsWith('docs/'))).toBe(false);

      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({ private: true }, null, 2)
      );
      const packageInstallRoot = join(tempDir, 'node_modules', '@geektech');
      const tsoneInstallRoot = join(packageInstallRoot, 'tsone');
      const oneChartInstallRoot = join(packageInstallRoot, 'one-chart');
      mkdirSync(tsoneInstallRoot, { recursive: true });
      mkdirSync(oneChartInstallRoot, { recursive: true });
      run(
        'tar',
        ['-xzf', tsoneTarball, '--strip-components=1', '-C', tsoneInstallRoot],
        tempDir
      );
      run(
        'tar',
        [
          '-xzf',
          oneChartTarball,
          '--strip-components=1',
          '-C',
          oneChartInstallRoot,
        ],
        tempDir
      );

      writeFileSync(
        join(tempDir, 'consumer.ts'),
        [
          'import {',
          '  ONE_CHART_DEFAULT_COLORS,',
          '  ONE_CHART_NAME,',
          '  ONE_CHART_VERSION,',
          '  OneBandScale,',
          '  OneBarChart,',
          '  OneCartesianChart,',
          '  OneChart,',
          '  OneChartDataError,',
          '  OneLinearScale,',
          '  OneLineChart,',
          '  OnePieChart,',
          '  OneRadarChart,',
          '  oneArcPath,',
          '  oneNiceTicks,',
          '  onePolygonPoints,',
          '  type OneBarChartProps,',
          '  type OneCartesianChartProps,',
          '  type OneChartProps,',
          '  type OneLineChartProps,',
          '  type OnePieChartProps,',
          '  type OneRadarChartProps,',
          '  type OneScale,',
          "} from '@geektech/one-chart';",
          '',
          'const barProps: OneBarChartProps = {',
          "  title: 'Sales',",
          "  categories: ['Q1', 'Q2'],",
          '  series: [{ name: \'East\', data: [10, 20] }],',
          '  stacked: false,',
          '};',
          'const lineProps: OneLineChartProps = {',
          "  categories: ['A', 'B'],",
          '  series: [{ name: \'N\', data: [1, 2] }],',
          "  curve: 'smooth',",
          '};',
          'const pieProps: OnePieChartProps = {',
          '  data: [{ name: \'A\', value: 1 }],',
          '  innerRadius: 0,',
          '};',
          'const radarProps: OneRadarChartProps = {',
          "  indicators: ['X', 'Y'],",
          '  series: [{ name: \'N\', data: [1, 2] }],',
          '};',
          'const baseProps: OneChartProps = { title: \'T\' };',
          'const cartesianProps: OneCartesianChartProps = {',
          "  categories: ['A'],",
          "  series: [{ name: 'N', data: [1] }],",
          '};',
          'const linear = new OneLinearScale([0, 10], [0, 100]);',
          "const band = new OneBandScale(['A', 'B'], [0, 100], { padding: 0.2 });",
          'const scale: OneScale = linear;',
          'const ticks: number[] = oneNiceTicks(0, 37, 4);',
          'const arc: string = oneArcPath(50, 50, 40, 0, 0, Math.PI / 2, 0.01);',
          'const points: string = onePolygonPoints([',
          '  [0, 0],',
          '  [10, 0],',
          ']);',
          'const bar = new OneBarChart(barProps);',
          'const line = new OneLineChart(lineProps);',
          'const pie = new OnePieChart(pieProps);',
          'const radar = new OneRadarChart(radarProps);',
          "const baseCtor: typeof OneChart = OneChart;",
          "const cartesianCtor: typeof OneCartesianChart = OneCartesianChart;",
          "const packageName: '@geektech/one-chart' = ONE_CHART_NAME;",
          "const packageVersion: '0.4.0' = ONE_CHART_VERSION;",
          'const firstColor: string = ONE_CHART_DEFAULT_COLORS[0];',
          'void bar;',
          'void line;',
          'void pie;',
          'void radar;',
          'void baseCtor;',
          'void cartesianCtor;',
          'void linear;',
          'void band;',
          'void scale;',
          'void ticks;',
          'void arc;',
          'void points;',
          'void OneChartDataError;',
          'void packageName;',
          'void packageVersion;',
          'void firstColor;',
        ].join('\n')
      );
      writeFileSync(
        join(tempDir, 'tsconfig.json'),
        JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2020',
              module: 'ESNext',
              moduleResolution: 'Bundler',
              lib: ['ES2020', 'DOM'],
              strict: true,
              skipLibCheck: false,
              noEmit: true,
            },
            include: ['consumer.ts'],
          },
          null,
          2
        )
      );

      writeFileSync(
        join(tempDir, 'runtime-consumer.mjs'),
        [
          'import {',
          '  ONE_CHART_DEFAULT_COLORS,',
          '  ONE_CHART_NAME,',
          '  ONE_CHART_VERSION,',
          '  OneBandScale,',
          '  OneBarChart,',
          '  OneLinearScale,',
          '  OneLineChart,',
          '  OnePieChart,',
          '  OneRadarChart,',
          '  oneNiceTicks,',
          '  onePercentLabel,',
          "} from '@geektech/one-chart';",
          '',
          'const band = new OneBandScale(',
          "  ['A', 'B', 'C'],",
          '  [0, 90],',
          '  { padding: 0.2 },',
          ');',
          'console.log(JSON.stringify({',
          '  name: ONE_CHART_NAME,',
          '  version: ONE_CHART_VERSION,',
          '  palette: ONE_CHART_DEFAULT_COLORS.slice(0, 2),',
          '  ticks: oneNiceTicks(0, 37, 4),',
          '  label: onePercentLabel(30, 100, 0.3),',
          '  band: {',
          '    bandwidth: band.bandwidth,',
          '    start: band.start,',
          '    middle: band.scaleIndex(1),',
          '  },',
          '  linear: new OneLinearScale([0, 10], [0, 100]).scale(5),',
          '  constructors: {',
          '    OneBarChart: typeof OneBarChart,',
          '    OneLineChart: typeof OneLineChart,',
          '    OnePieChart: typeof OnePieChart,',
          '    OneRadarChart: typeof OneRadarChart,',
          '  },',
          '}));',
        ].join('\n')
      );

      run(process.execPath, [tscBin, '--project', 'tsconfig.json'], tempDir);
      const runtimeResult = JSON.parse(
        run('bun', ['runtime-consumer.mjs'], tempDir)
      ) as {
        name: string;
        version: string;
        palette: string[];
        ticks: number[];
        label: string;
        band: { bandwidth: number; start: number; middle: number };
        linear: number;
        constructors: Record<
          | 'OneBarChart'
          | 'OneLineChart'
          | 'OnePieChart'
          | 'OneRadarChart',
          string
        >;
      };

      expect(runtimeResult).toEqual({
        name: '@geektech/one-chart',
        version: '0.4.0',
        palette: ['#4e79a7', '#f28e2b'],
        ticks: [0, 10, 20, 30, 40],
        label: '30%',
        band: { bandwidth: 22.5, start: 5.625, middle: 33.75 },
        linear: 50,
        constructors: {
          OneBarChart: 'function',
          OneLineChart: 'function',
          OnePieChart: 'function',
          OneRadarChart: 'function',
        },
      });

      expect(readdirSync(join(tempDir, 'node_modules', '@geektech'))).toEqual(
        expect.arrayContaining(['one-chart', 'tsone'])
      );
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  }, 20_000);
});
