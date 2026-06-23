import { execFileSync } from 'node:child_process';
import {
  existsSync,
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

const root = process.cwd();
const bunTemp = '/private/tmp/tsone-bun-tmp';
const bunCache = '/private/tmp/tsone-bun-cache';
const packageName = '@geektech/tsone';
const require = createRequire(import.meta.url);
const tscBin = require.resolve('typescript/bin/tsc');

function packageVersion(): string {
  return JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
    .version as string;
}

function run(command: string, args: string[], cwd = root): string {
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
}

describe('package smoke', () => {
  it('packs an installable library with matching exports and types', () => {
    mkdirSync(tmpdir(), { recursive: true });
    mkdirSync(bunTemp, { recursive: true });
    mkdirSync(bunCache, { recursive: true });
    const tempDir = mkdtempSync(join(tmpdir(), 'tsone-package-'));

    try {
      run('bun', ['run', 'build']);

      run('bun', [
        'pm',
        'pack',
        '--destination',
        tempDir,
        '--ignore-scripts',
        '--quiet',
      ]);
      const packedFile = readdirSync(tempDir).find((file) =>
        file.endsWith('.tgz')
      );
      expect(packedFile).toBeTruthy();
      const tarball = join(tempDir, packedFile as string);
      const packageFileList = run('tar', ['-tzf', tarball])
        .split('\n')
        .filter(Boolean)
        .map((file) => file.replace(/^package\//, ''));
      const packageFiles = new Set(packageFileList);

      expect(packageFileList).toEqual(
        expect.arrayContaining([
          'dist/index.js',
          'dist/index.d.ts',
          'dist/router/index.js',
          'dist/router/index.d.ts',
          'dist/style/index.js',
          'dist/style/index.d.ts',
          'README.md',
          'LICENSE',
          'package.json',
        ])
      );
      expect(
        [...packageFiles].some((file) => file.startsWith('dist/lib/'))
      ).toBe(false);
      expect(
        [...packageFiles].some((file) => file.startsWith('dist/examples/'))
      ).toBe(false);
      expect([...packageFiles].some((file) => file.startsWith('lib/'))).toBe(
        false
      );

      expect(existsSync(tarball)).toBe(true);

      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({ private: true }, null, 2)
      );
      run('bun', ['add', '--ignore-scripts', tarball], tempDir);

      writeFileSync(
        join(tempDir, 'bun-consumer.ts'),
        [
          `import { Button, Component, Div, Input, P, Span, name, reactive, version } from '${packageName}';`,
          `import { RouterLink, RouterView, createRouter } from '${packageName}/router';`,
          `import { StyleManager } from '${packageName}/style';`,
          '',
          'console.log(JSON.stringify({',
          '  name,',
          '  version,',
          '  component: typeof Component,',
          '  reactive: typeof reactive,',
          '  router: typeof createRouter,',
          '  routerLink: typeof RouterLink,',
          '  routerView: typeof RouterView,',
          '  style: typeof StyleManager,',
          '  div: typeof Div,',
          '  span: typeof Span,',
          '  paragraph: typeof P,',
          '  button: typeof Button,',
          '  input: typeof Input,',
          '}));',
        ].join('\n')
      );
      expect(
        JSON.parse(run('bun', ['run', 'bun-consumer.ts'], tempDir))
      ).toEqual({
        name: '@geektech/tsone',
        version: packageVersion(),
        component: 'function',
        reactive: 'function',
        router: 'function',
        routerLink: 'function',
        routerView: 'function',
        style: 'function',
        div: 'function',
        span: 'function',
        paragraph: 'function',
        button: 'function',
        input: 'function',
      });

      writeFileSync(
        join(tempDir, 'consumer.ts'),
        [
          `import { Component, Div, VNode, createApp, reactive } from '${packageName}';`,
          `import { RouterLink, RouterView, createRouter } from '${packageName}/router';`,
          '',
          'interface AppState {',
          '  count: number;',
          '}',
          '',
          'class App extends Component<object, AppState> {',
          '  protected initState(): AppState {',
          '    return { count: 0 };',
          '  }',
          '  protected initStyles(): void {}',
          '  protected render(): VNode {',
          '    return Div({ children: [String(this.state.count)] });',
          '  }',
          '}',
          '',
          'const state = reactive({ ready: true });',
          "const router = createRouter([{ path: '/', component: App }]);",
          "const app = createApp({ root: App, rootElement: '#app', state });",
          'app.use(router);',
          'void RouterLink;',
          'void RouterView;',
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

      run(process.execPath, [tscBin, '--project', 'tsconfig.json'], tempDir);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
