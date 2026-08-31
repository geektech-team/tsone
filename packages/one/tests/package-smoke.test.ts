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
  it('packs an installable peer-based library with real ESM runtime and strict consumer types', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'one-package-'));
    const bunTemp = join(tempDir, 'bun-tmp');
    const bunCache = join(tempDir, 'bun-cache');
    const run = createRunner(bunTemp, bunCache);

    try {
      mkdirSync(bunTemp, { recursive: true });
      mkdirSync(bunCache, { recursive: true });
      run('bun', ['run', 'build'], tsoneRoot);
      run('bun', ['run', 'build']);

      const oneBundle = readFileSync(join(oneRoot, 'dist', 'index.js'), 'utf8');
      expect(oneBundle).toMatch(/from ["']@geektech\/tsone["']/);

      const tsoneManifest = JSON.parse(
        readFileSync(join(tsoneRoot, 'package.json'), 'utf8')
      ) as { name: string; version: string };
      const tsoneTarball = join(
        tempDir,
        `${tsoneManifest.name.replace('@', '').replace('/', '-')}-${tsoneManifest.version}.tgz`
      );
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
      const packageInstallRoot = join(tempDir, 'node_modules', '@geektech');
      const tsoneInstallRoot = join(packageInstallRoot, 'tsone');
      const oneInstallRoot = join(packageInstallRoot, 'one');
      mkdirSync(tsoneInstallRoot, { recursive: true });
      mkdirSync(oneInstallRoot, { recursive: true });
      run(
        'tar',
        ['-xzf', tsoneTarball, '--strip-components=1', '-C', tsoneInstallRoot],
        tempDir
      );
      run(
        'tar',
        ['-xzf', oneTarball, '--strip-components=1', '-C', oneInstallRoot],
        tempDir
      );

      writeFileSync(
        join(tempDir, 'consumer.ts'),
        [
          'import {',
          '  ONE_NAME,',
          '  ONE_THEME_DEFAULTS,',
          '  ONE_VERSION,',
          '  OneAlert,',
          '  OneButton,',
          '  OneCard,',
          '  OneDialog,',
          '  OneInput,',
          '  OneMessage,',
          '  OneTooltip,',
          '  oneDialog,',
          '  oneMessage,',
          '  type OneAlertProps,',
          '  type OneButtonProps,',
          '  type OneButtonVariant,',
          '  type OneCardProps,',
          '  type OneComponentSize,',
          '  type OneDialogProps,',
          '  type OneInputProps,',
          '  type OneInputValueEvent,',
          '  type OneMessageOptions,',
          '  type OneTooltipProps,',
          "} from '@geektech/one';",
          '',
          "const size: OneComponentSize = 'md';",
          "const variant: OneButtonVariant = 'primary';",
          'const buttonProps: OneButtonProps = { size, variant };',
          "const inputProps: OneInputProps = { value: 'One', size };",
          "const cardProps: OneCardProps = { title: 'One', children: ['Body'] };",
          "const alertProps: OneAlertProps = { title: 'Info', variant: 'info' };",
          "const messageOptions: OneMessageOptions = { content: 'Saved', duration: 0 };",
          "const dialogProps: OneDialogProps = { title: 'Confirm', defaultOpen: false };",
          'const tooltipProps: OneTooltipProps = {',
          "  content: 'Help',",
          "  placement: 'bottom-end',",
          "  children: [{ tag: 'button', children: ['?'] }],",
          '};',
          'const inputEvent: OneInputValueEvent | undefined = undefined;',
          'const button = new OneButton(buttonProps);',
          'const input = new OneInput(inputProps);',
          'const card = new OneCard(cardProps);',
          'const alert = new OneAlert(alertProps);',
          'const message = new OneMessage(messageOptions);',
          'const dialog = new OneDialog(dialogProps);',
          'const tooltip = new OneTooltip(tooltipProps);',
          "const packageName: '@geektech/one' = ONE_NAME;",
          "const packageVersion: '0.0.1' = ONE_VERSION;",
          "const primary: '#5fd956' = ONE_THEME_DEFAULTS.colorPrimary;",
          'void inputEvent;',
          'void button;',
          'void input;',
          'void card;',
          'void alert;',
          'void message;',
          'void dialog;',
          'void tooltip;',
          'void oneMessage;',
          'void oneDialog;',
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

      writeFileSync(
        join(tempDir, 'runtime-consumer.mjs'),
        [
          'import {',
          '  ONE_NAME,',
          '  ONE_THEME_DEFAULTS,',
          '  ONE_VERSION,',
          '  OneAlert,',
          '  OneButton,',
          '  OneCard,',
          '  OneDialog,',
          '  OneInput,',
          '  OneMessage,',
          '  OneTooltip,',
          '  oneDialog,',
          '  oneMessage,',
          "} from '@geektech/one';",
          '',
          'console.log(JSON.stringify({',
          '  name: ONE_NAME,',
          '  version: ONE_VERSION,',
          '  theme: {',
          '    primary: ONE_THEME_DEFAULTS.colorPrimary,',
          '    danger: ONE_THEME_DEFAULTS.colorDanger,',
          '    dangerHover: ONE_THEME_DEFAULTS.colorDangerHover,',
          '  },',
          '  constructors: {',
          '    OneButton: typeof OneButton,',
          '    OneInput: typeof OneInput,',
          '    OneCard: typeof OneCard,',
          '    OneAlert: typeof OneAlert,',
          '    OneMessage: typeof OneMessage,',
          '    OneDialog: typeof OneDialog,',
          '    OneTooltip: typeof OneTooltip,',
          '  },',
          '  services: {',
          '    oneMessage: typeof oneMessage.success,',
          '    oneDialog: typeof oneDialog.confirm,',
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
        theme: { primary: string; danger: string; dangerHover: string };
        constructors: Record<
          | 'OneButton'
          | 'OneInput'
          | 'OneCard'
          | 'OneAlert'
          | 'OneMessage'
          | 'OneDialog'
          | 'OneTooltip',
          string
        >;
        services: Record<'oneMessage' | 'oneDialog', string>;
      };

      expect(runtimeResult).toEqual({
        name: '@geektech/one',
        version: '0.0.1',
        theme: {
          primary: '#5fd956',
          danger: '#b83232',
          dangerHover: '#9f2d2d',
        },
        constructors: {
          OneButton: 'function',
          OneInput: 'function',
          OneCard: 'function',
          OneAlert: 'function',
          OneMessage: 'function',
          OneDialog: 'function',
          OneTooltip: 'function',
        },
        services: {
          oneMessage: 'function',
          oneDialog: 'function',
        },
      });

      expect(readdirSync(join(tempDir, 'node_modules', '@geektech'))).toEqual(
        expect.arrayContaining(['one', 'tsone'])
      );
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  }, 15_000);
});
