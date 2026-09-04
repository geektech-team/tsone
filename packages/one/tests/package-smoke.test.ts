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
      const oneTarball = join(tempDir, 'geektech-one-0.3.3.tgz');
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
          '  ONE_DEFAULT_THEME,',
          '  ONE_NAME,',
          '  ONE_THEME_DEFAULTS,',
          '  ONE_VERSION,',
          '  OneAlert,',
          '  OneBadge,',
          '  OneBreadcrumb,',
          '  OneButton,',
          '  OneCard,',
          '  OneDialog,',
          '  OneEmpty,',
          '  OneInput,',
          '  OneMessage,',
          '  OnePagination,',
          '  OneTag,',
          '  OneTabs,',
          '  OneTooltip,',
          '  OneAvatar,',
          '  OneLoading,',
          '  OneProgress,',
          '  OneRadio,',
          '  OneRadioGroup,',
          '  OneTimePicker,',
          '  OneThemeConfigError,',
          '  OneThemeEnvironmentError,',
          '  OneThemeNotFoundError,',
          '  oneDialog,',
          '  oneMessage,',
          '  oneTheme,',
          '  type OneAlertProps,',
          '  type OneBadgeProps,',
          '  type OneBreadcrumbItem,',
          '  type OneBreadcrumbProps,',
          '  type OneButtonProps,',
          '  type OneButtonVariant,',
          '  type OneCardProps,',
          '  type OneComponentSize,',
          '  type OneDataDisplayVariant,',
          '  type OneDialogProps,',
          '  type OneEmptyProps,',
          '  type OneInputProps,',
          '  type OneInputValueEvent,',
          '  type OneMessageOptions,',
          '  type OnePaginationProps,',
          '  type OneTagProps,',
          '  type OneTabItem,',
          '  type OneTabsProps,',
          '  type OneTooltipProps,',
          '  type OneAvatarProps,',
          '  type OneAvatarShape,',
          '  type OneLoadingProps,',
          '  type OneProgressProps,',
          '  type OneRadioGroupProps,',
          '  type OneRadioProps,',
          '  type OneTimePickerProps,',
          '  type OneTimePickerValueEvent,',
          '  type OneResolvedTheme,',
          '  type OneThemeBorder,',
          '  type OneThemeColors,',
          '  type OneThemeDefinition,',
          '  type OneThemeInitOptions,',
          '  type OneThemeRadius,',
          '  type OneThemeService,',
          '  type OneThemeTypography,',
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
          "const displayVariant: OneDataDisplayVariant = 'neutral';",
          "const tagProps: OneTagProps = { variant: 'success', closable: true };",
          'const badgeProps: OneBadgeProps = { value: 120, max: 99 };',
          "const emptyProps: OneEmptyProps = { description: 'No results' };",
          'const tooltipProps: OneTooltipProps = {',
          "  content: 'Help',",
          "  placement: 'bottom-end',",
          "  children: [{ tag: 'button', children: ['?'] }],",
          '};',
          "const tabItem = { value: 'overview', label: 'Overview' } satisfies OneTabItem;",
          'const tabsProps: OneTabsProps = { items: [tabItem] };',
          "const breadcrumbItem = { label: 'Home', href: '/' } satisfies OneBreadcrumbItem;",
          'const breadcrumbProps: OneBreadcrumbProps = { items: [breadcrumbItem] };',
          'const paginationProps: OnePaginationProps = { total: 100 };',
          "const radioProps: OneRadioProps = { value: 'design', defaultChecked: true };",
          'const radioGroupProps: OneRadioGroupProps = {',
          "  options: [{ value: 'design', label: 'Design' }],",
          "  defaultValue: 'design',",
          '};',
          "const timePickerProps: OneTimePickerProps = { defaultValue: '09:30', step: 1 };",
          "const avatarProps: OneAvatarProps = { src: '/a.png', alt: 'Avatar', shape: 'square' };",
          "const avatarShape: OneAvatarShape = 'circle';",
          "const progressProps: OneProgressProps = { percent: 80, variant: 'success', showText: true };",
          "const loadingProps: OneLoadingProps = { size: 'lg', variant: 'primary', label: 'Loading' };",
          'const inputEvent: OneInputValueEvent | undefined = undefined;',
          'const themeDefinition: OneThemeDefinition = {',
          "  colors: { primary: '#112233' },",
          "  typography: { lineHeight: '1.7' },",
          "  border: { width: '2px', style: 'dashed' },",
          "  radius: { lg: '12px' },",
          '};',
          'const themeOptions: OneThemeInitOptions = {',
          "  defaultTheme: 'brand',",
          '  themes: { brand: themeDefinition },',
          '};',
          'const themeService: OneThemeService = oneTheme;',
          'const resolvedTheme: OneResolvedTheme = ONE_DEFAULT_THEME;',
          'const colors: OneThemeColors = resolvedTheme.colors;',
          'const typography: OneThemeTypography = resolvedTheme.typography;',
          'const border: OneThemeBorder = resolvedTheme.border;',
          'const radius: OneThemeRadius = resolvedTheme.radius;',
          'if (false) {',
          '  oneTheme.init(themeOptions);',
          "  oneTheme.switch('brand');",
          '  // @ts-expect-error switchTheme is intentionally absent',
          "  oneTheme.switchTheme('brand');",
          '}',
          'const button = new OneButton(buttonProps);',
          'const input = new OneInput(inputProps);',
          'const card = new OneCard(cardProps);',
          'const tag = new OneTag(tagProps);',
          'const badge = new OneBadge(badgeProps);',
          'const empty = new OneEmpty(emptyProps);',
          'const alert = new OneAlert(alertProps);',
          'const message = new OneMessage(messageOptions);',
          'const dialog = new OneDialog(dialogProps);',
          'const tooltip = new OneTooltip(tooltipProps);',
          'const tabs = new OneTabs(tabsProps);',
          'const breadcrumb = new OneBreadcrumb(breadcrumbProps);',
          'const pagination = new OnePagination(paginationProps);',
          'const radio = new OneRadio(radioProps);',
          'const radioGroup = new OneRadioGroup(radioGroupProps);',
          'const timePicker = new OneTimePicker(timePickerProps);',
          'const avatar = new OneAvatar(avatarProps);',
          'const progress = new OneProgress(progressProps);',
          'const loading = new OneLoading(loadingProps);',
          "const packageName: '@geektech/one' = ONE_NAME;",
          "const packageVersion: '0.3.3' = ONE_VERSION;",
          "const primary: '#5fd956' = ONE_THEME_DEFAULTS.colorPrimary;",
          'void inputEvent;',
          'void button;',
          'void input;',
          'void card;',
          'void tag;',
          'void badge;',
          'void empty;',
          'void displayVariant;',
          'void alert;',
          'void message;',
          'void dialog;',
          'void tooltip;',
          'void tabs;',
          'void breadcrumb;',
          'void pagination;',
          'void radio;',
          'void radioGroup;',
          'void timePicker;',
          'void avatar;',
          'void progress;',
          'void loading;',
          'void avatarShape;',
          'void oneMessage;',
          'void oneDialog;',
          'void themeService;',
          'void colors;',
          'void typography;',
          'void border;',
          'void radius;',
          'void OneThemeConfigError;',
          'void OneThemeNotFoundError;',
          'void OneThemeEnvironmentError;',
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
          '  ONE_DEFAULT_THEME,',
          '  ONE_NAME,',
          '  ONE_THEME_DEFAULTS,',
          '  ONE_VERSION,',
          '  OneAlert,',
          '  OneBadge,',
          '  OneBreadcrumb,',
          '  OneButton,',
          '  OneCard,',
          '  OneDialog,',
          '  OneEmpty,',
          '  OneInput,',
          '  OneMessage,',
          '  OnePagination,',
          '  OneTag,',
          '  OneTabs,',
          '  OneTooltip,',
          '  OneAvatar,',
          '  OneLoading,',
          '  OneProgress,',
          '  OneRadio,',
          '  OneRadioGroup,',
          '  OneTimePicker,',
          '  oneDialog,',
          '  oneMessage,',
          '  oneTheme,',
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
          '    OneTag: typeof OneTag,',
          '    OneBadge: typeof OneBadge,',
          '    OneEmpty: typeof OneEmpty,',
          '    OneAlert: typeof OneAlert,',
          '    OneMessage: typeof OneMessage,',
          '    OneDialog: typeof OneDialog,',
          '    OneTooltip: typeof OneTooltip,',
          '    OneTabs: typeof OneTabs,',
          '    OneBreadcrumb: typeof OneBreadcrumb,',
          '    OnePagination: typeof OnePagination,',
          '    OneAvatar: typeof OneAvatar,',
          '    OneLoading: typeof OneLoading,',
          '    OneProgress: typeof OneProgress,',
          '    OneRadio: typeof OneRadio,',
          '    OneRadioGroup: typeof OneRadioGroup,',
          '    OneTimePicker: typeof OneTimePicker,',
          '  },',
          '  services: {',
          '    oneMessage: typeof oneMessage.success,',
          '    oneDialog: typeof oneDialog.confirm,',
          '  },',
          '  themeService: {',
          '    defaultPrimary: ONE_DEFAULT_THEME.colors.primary,',
          '    current: oneTheme.currentTheme,',
          '    init: typeof oneTheme.init,',
          '    switch: typeof oneTheme.switch,',
          "    legacySwitch: 'switchTheme' in oneTheme,",
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
          | 'OneTag'
          | 'OneBadge'
          | 'OneEmpty'
          | 'OneAlert'
          | 'OneMessage'
          | 'OneDialog'
          | 'OneTooltip'
          | 'OneTabs'
          | 'OneBreadcrumb'
          | 'OnePagination'
          | 'OneAvatar'
          | 'OneLoading'
          | 'OneProgress'
          | 'OneRadio'
          | 'OneRadioGroup'
          | 'OneTimePicker',
          string
        >;
        services: Record<'oneMessage' | 'oneDialog', string>;
        themeService: {
          defaultPrimary: string;
          current: string;
          init: string;
          switch: string;
          legacySwitch: boolean;
        };
      };

      expect(runtimeResult).toEqual({
        name: '@geektech/one',
        version: '0.3.3',
        theme: {
          primary: '#5fd956',
          danger: '#b83232',
          dangerHover: '#9f2d2d',
        },
        constructors: {
          OneButton: 'function',
          OneInput: 'function',
          OneCard: 'function',
          OneTag: 'function',
          OneBadge: 'function',
          OneEmpty: 'function',
          OneAlert: 'function',
          OneMessage: 'function',
          OneDialog: 'function',
          OneTooltip: 'function',
          OneTabs: 'function',
          OneBreadcrumb: 'function',
          OnePagination: 'function',
          OneAvatar: 'function',
          OneLoading: 'function',
          OneProgress: 'function',
          OneRadio: 'function',
          OneRadioGroup: 'function',
          OneTimePicker: 'function',
        },
        services: {
          oneMessage: 'function',
          oneDialog: 'function',
        },
        themeService: {
          defaultPrimary: '#5fd956',
          current: 'default',
          init: 'function',
          switch: 'function',
          legacySwitch: false,
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
