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

const oneRoot = join(import.meta.dir, '..');
const repositoryRoot = join(oneRoot, '..', '..');
const tsoneRoot = join(repositoryRoot, 'packages', 'tsone');
const require = createRequire(import.meta.url);
const tscBin = require.resolve('typescript/bin/tsc');

function createRunner(bunTemp: string, bunCache: string) {
  return function run(command: string, args: string[], cwd = oneRoot): string {
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

describe('One UI package smoke', () => {
  it('packs an installable peer-based library with strict consumer types', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'one-package-'));
    const bunTemp = join(tempDir, 'bun-tmp');
    const bunCache = join(tempDir, 'bun-cache');
    const run = createRunner(bunTemp, bunCache);

    try {
      mkdirSync(bunTemp, { recursive: true });
      mkdirSync(bunCache, { recursive: true });
      run('bun', ['run', 'build']);

      const oneBundle = readFileSync(join(oneRoot, 'dist', 'index.js'), 'utf8');
      expect(oneBundle).toMatch(/from ["']@geektech\/tsone["']/);

      const tsoneTarball = join(tempDir, 'geektech-tsone-0.0.2.tgz');
      const oneTarball = join(tempDir, 'geektech-one-0.0.1.tgz');
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

      const packageFiles = run('tar', ['-tzf', oneTarball])
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
      run(
        'bun',
        ['add', '--ignore-scripts', tsoneTarball, oneTarball],
        tempDir
      );

      writeFileSync(
        join(tempDir, 'consumer.ts'),
        [
          'import {',
          '  ONE_NAME,',
          '  ONE_THEME_DEFAULTS,',
          '  ONE_VERSION,',
          '  OneButton,',
          '  OneCard,',
          '  OneInput,',
          '  type OneButtonProps,',
          '  type OneButtonVariant,',
          '  type OneCardProps,',
          '  type OneComponentSize,',
          '  type OneInputProps,',
          '  type OneInputValueEvent,',
          "} from '@geektech/one';",
          '',
          "const size: OneComponentSize = 'md';",
          "const variant: OneButtonVariant = 'primary';",
          'const buttonProps: OneButtonProps = { size, variant };',
          "const inputProps: OneInputProps = { value: 'One', size };",
          "const cardProps: OneCardProps = { title: 'One', children: ['Body'] };",
          'const inputEvent: OneInputValueEvent | undefined = undefined;',
          'const button = new OneButton(buttonProps);',
          'const input = new OneInput(inputProps);',
          'const card = new OneCard(cardProps);',
          "const packageName: '@geektech/one' = ONE_NAME;",
          "const packageVersion: '0.0.1' = ONE_VERSION;",
          "const primary: '#5fd956' = ONE_THEME_DEFAULTS.colorPrimary;",
          'void inputEvent;',
          'void button;',
          'void input;',
          'void card;',
          'void packageName;',
          'void packageVersion;',
          'void primary;',
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

      expect(readdirSync(join(tempDir, 'node_modules', '@geektech'))).toEqual(
        expect.arrayContaining(['one', 'tsone'])
      );
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
