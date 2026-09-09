import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'bun:test';
import * as cliApi from '../../tsone-cli/src';
import * as publicApi from '../lib';
import * as routerApi from '../lib/router';
import { docPages, docText, findLocalizedDocPage } from '../docs/app/content';
import { packagePath } from './paths';

function readText(path: string): string {
  return readFileSync(packagePath(path), 'utf8');
}

function packageVersion(): string {
  return JSON.parse(readText('package.json')).version as string;
}

function packageName(): string {
  return JSON.parse(readText('package.json')).name as string;
}

function docsTextFor(path: string): string {
  const page = docPages.find((item) => item.path === path);
  if (!page) {
    throw new Error(`Missing docs page: ${path}`);
  }

  return docText(page);
}

function localizedDocsTextFor(locale: 'en' | 'zh', paths: string[]): string {
  return paths
    .map((path) => {
      const page = findLocalizedDocPage(locale, path);
      if (!page) {
        throw new Error(`Missing ${locale} docs page: ${path}`);
      }

      return docText(page);
    })
    .join('\n');
}

function normalizeProse(text: string): string {
  return text
    .replace(/([\u3400-\u9fff])\s+(?=[\u3400-\u9fff])/gu, '$1')
    .replace(/`/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();
}

const ENGLISH_INVERSE_SCOPE_PATTERNS = [
  /development server[^.]{0,80}\b(?:serves?|supports?|provides?)\s+(?:HTTP\s+(?:and|or)\s+|HTTP\/)?HTTPS\b/iu,
  /proxy targets?[^.]{0,50}\b(?:are|(?:may\s+)?use|supports?|accepts?)\s+HTTP only\b/iu,
  /\b(?:the )?(?:CLI(?: v1)?|config(?:uration)?|development server|dev server|build)[^.]{0,50}(?<!not )\b(?:supports?|provides?|enables?|allows?)\s+(?:config\s+)?(?:plugins?|WebSocket|HMR|SSR)\b/iu,
  /\b(?:the )?(?:CLI(?: v1)?|config(?:uration)?|development server|dev server|build)[^.]{0,50}(?<!not )\b(?:supports?|provides?|enables?|allows?)\s+(?:a\s+)?(?:functional|function-valued) config\b/iu,
  /\b(?:the )?(?:CLI(?: v1)?|config(?:uration)?|development server|dev server|build)[^.]{0,60}\b(?:copies|will copy)\s+(?:the\s+)?public\/?/iu,
  /\b(?:the )?(?:CLI(?: v1)?|config(?:uration)?|development server|dev server|build)[^.]{0,60}\b(?:allows?|configures?|supports?|provides?)\s+(?:public\s+)?(?:minify|sourcemap)/iu,
] as const;

const CHINESE_INVERSE_SCOPE_PATTERNS = [
  /开发服务器[^。；]{0,50}(?<!不)(?:支持|提供|使用)\s*HTTPS/iu,
  /代理目标[^。；]{0,50}(?:仅|只)(?:支持|允许|使用)?\s*HTTP/iu,
  /(?:CLI|配置|config|开发服务器|构建|build)[^。；]{0,50}(?<!不)(?<!未)(?:支持|提供|启用|允许)\s*(?:plugins?|插件|WebSocket|HMR|SSR)/iu,
  /(?:CLI|配置|config|开发服务器|构建|build)[^。；]{0,50}(?<!不)(?<!未)(?:支持|提供|启用|允许)\s*(?:函数式配置|函数值配置|functional config)/iu,
  /(?:CLI|配置|config|开发服务器|构建|build)[^。；]{0,50}(?<!不)(?<!未)(?:复制|拷贝)\s*public\/?/iu,
  /(?:CLI|配置|config|开发服务器|构建|build)[^。；]{0,50}(?<!不)(?<!未)(?:允许|配置|支持|提供)\s*(?:minify|sourcemap)/iu,
] as const;

function matchingPatterns(text: string, patterns: readonly RegExp[]): string[] {
  const prose = normalizeProse(text);
  return patterns
    .filter((pattern) => pattern.test(prose))
    .map((pattern) => pattern.source);
}

function patternMatchCounts(
  statements: string[],
  patterns: readonly RegExp[]
): number[] {
  return patterns.map(
    (pattern) =>
      statements.filter((statement) => pattern.test(normalizeProse(statement)))
        .length
  );
}

function expectEnglishCliScope(text: string): void {
  const prose = normalizeProse(text);

  expect(prose).toContain(
    'The development server serves HTTP only. Proxy targets may use HTTP or HTTPS.'
  );
  expect(prose).toContain(
    'The config file supports only a plain-object default export; functional or function-valued config is not supported.'
  );
  expect(prose).toMatch(
    /CLI v1 has no config plugins, WebSocket, HMR, SSR[^.]*functional config[^.]*public\/(?: directory)? copying[^.]*minify(?:\/| and )sourcemap (?:configuration|settings)/iu
  );
  expect(matchingPatterns(prose, ENGLISH_INVERSE_SCOPE_PATTERNS)).toEqual([]);
}

function expectChineseCliScope(text: string): void {
  const prose = normalizeProse(text);

  expect(prose).toContain(
    '开发服务器仅提供 HTTP。代理目标可以使用 HTTP 或 HTTPS。'
  );
  expect(prose).toContain(
    '配置文件只支持普通对象默认导出；不支持函数式配置或函数值配置。'
  );
  expect(prose).toMatch(
    /CLI 首版配置不提供 plugins、WebSocket、HMR、SSR[^。]*函数式配置[^。]*public\/ 复制[^。]*minify\/sourcemap (?:配置|设置)/u
  );
  expect(matchingPatterns(prose, CHINESE_INVERSE_SCOPE_PATTERNS)).toEqual([]);
}

describe('public API documentation', () => {
  it('keeps README examples aligned with current package metadata and Bun commands', () => {
    const readme = readText('README.md');

    expect(readme).toContain(`version: '${packageVersion()}'`);
    expect(readme).toContain(`bun add ${packageName()}`);
    expect(readme).not.toMatch(/version:\s*['"]0\.0\.0['"]/);
    expect(readme).toContain('bun run build');
    expect(readme).toContain('bun run dev');
    expect(readme).toContain('bun run docs');
    expect(readme).toContain('bun run docs:build');
    expect(readme).toContain('bun test');
  });

  it('documents the bilingual documentation workflow in both READMEs', () => {
    const englishReadme = readText('README.md');
    const chineseReadme = readText('README-zh.md');

    expect(englishReadme).toContain('content/en');
    expect(englishReadme).toContain('content/zh');
    expect(englishReadme).toContain(
      'Chinese and English catalogs each contain exactly 15 logical routes'
    );
    expect(englishReadme).toMatch(
      /Add or\s+remove a route in both catalogs in the same change/u
    );
    expect(englishReadme).toContain('/en/');
    expect(englishReadme).toContain('never write `/en/` manually');
    expect(englishReadme).toContain('only at `/`');
    expect(englishReadme).toContain('manual selection takes precedence');
    expect(englishReadme).toMatch(
      /missing, extra, duplicate, empty, or\s+mixed-language pages/u
    );
    expect(chineseReadme).toContain('content/zh');
    expect(chineseReadme).toContain('content/en');
    expect(chineseReadme).toContain('中英文 catalog 当前各包含 15 条逻辑路由');
    expect(chineseReadme).toContain('新增或删除路由时必须同步修改两边');
    expect(chineseReadme).toContain('中英文逻辑路由必须一致');
    expect(chineseReadme).toContain('不要手写 `/en/`');
    expect(chineseReadme).toContain('仅在 `/`');
    expect(chineseReadme).toContain('手动选择优先');
    expect(chineseReadme).toContain('缺失、多余、重复、空内容或混用语言');
  });

  it('documents the public root exports used by framework consumers', () => {
    const readme = readText('README.md');
    const appApi = docsTextFor('/api/app/');
    const componentApi = docsTextFor('/api/component/');
    const reactiveApi = docsTextFor('/api/reactive/');

    for (const symbol of [
      'createApp',
      'Component',
      'Div',
      'Span',
      'P',
      'Button',
      'Input',
      'Tag',
      'Section',
      'H1',
      'A',
      'Form',
      'Table',
      'TransitionGroup',
      'TransitionAnimationType',
      'Transition',
      'KeepAlive',
      'beforeEach',
      'afterEach',
      'redirect',
      'VNode',
      'renderHtmlDocument',
      'StyleSheet',
      'reactive',
      'effect',
      'computed',
      'isRef',
      'unref',
      'watch',
      'nextTick',
      'flushSync',
      'each',
      'createForm',
      'required',
      'minLength',
      'validate',
    ]) {
      expect(readme).toContain(symbol);
    }

    expect(appApi).toContain('root');
    expect(appApi).toContain('rootProps');
    expect(appApi).toContain('createApp({ root: App');
    expect(appApi).toContain('renderHtmlDocument');
    expect(appApi).toContain('document?: AppDocumentOptions');
    expect(appApi).toContain('app.renderHtmlDocument');
    expect(appApi).toContain('StyleSheet');
    expect(appApi).toContain('DOM-like document');
    expect(readme).toContain('DOM-like document');
    expect(componentApi).toContain('Component<Props, State>');
    expect(componentApi).toContain('protected render(): VNode');
    expect(reactiveApi).toContain('computed');
    expect(reactiveApi).toContain('isRef');
    expect(reactiveApi).toContain('unref');
    expect(componentApi).toContain('directions: { if: this.state.visible }');
    expect(componentApi).toContain('emitters');
    expect(componentApi).toContain('provide');
    expect(componentApi).toContain('directions: { model:');
    expect(componentApi).toContain('createForm');
    expect(componentApi).toContain("Tag('dialog'");
    expect(componentApi).toContain('Section({');
    expect(componentApi).toContain('TransitionGroup');
    expect(componentApi).toContain('TransitionAnimationType');
    expect(componentApi).toContain("type: 'fade'");
    expect(componentApi).toContain('slide-up');
    expect(componentApi).toContain('prefers-reduced-motion');
    expect(componentApi).toContain('children: each(');
    expect(readme).toContain('prefers-reduced-motion');
  });

  it('documents RouterView and RouterLink as public router component exits', () => {
    const readme = readText('README.md');
    const routerApi = docsTextFor('/api/router/');

    expect(readme).toContain('RouterView');
    expect(readme).toContain('RouterLink');
    expect(routerApi).toContain('RouterView');
    expect(routerApi).toContain('RouterLink');
    expect(routerApi).toContain('createRouter({ routes');
  });

  it('keeps documented public symbols exported from source entrypoints', () => {
    for (const symbol of [
      'createApp',
      'Component',
      'Div',
      'Span',
      'P',
      'Button',
      'Input',
      'Tag',
      'Section',
      'H1',
      'A',
      'Form',
      'Table',
      'TransitionGroup',
      'Transition',
      'KeepAlive',
      'renderHtmlDocument',
      'renderStyleSheet',
      'reactive',
      'readonly',
      'effect',
      'stop',
      'computed',
      'ref',
      'isRef',
      'unref',
      'nextTick',
      'flushSync',
      'version',
      'each',
      'createForm',
      'required',
      'minLength',
      'validate',
    ]) {
      expect(publicApi).toHaveProperty(symbol);
    }

    for (const symbol of [
      'createRouter',
      'Router',
      'RouterView',
      'RouterLink',
      'useRouter',
    ]) {
      expect(routerApi).toHaveProperty(symbol);
    }
  });

  it('makes CLI tooling discoverable from both localized framework docs', () => {
    for (const symbol of [
      'defineConfig',
      'resolveConfig',
      'startDevServer',
      'build',
    ]) {
      expect(cliApi).toHaveProperty(symbol);
    }

    const paths = ['/guide/getting-started/', '/api/app/'];
    const localizedApiText = {
      en: localizedDocsTextFor('en', ['/api/app/']),
      zh: localizedDocsTextFor('zh', ['/api/app/']),
    };
    const localizedText = {
      en: [readText('README.md'), localizedDocsTextFor('en', paths)].join('\n'),
      zh: [readText('README-zh.md'), localizedDocsTextFor('zh', paths)].join(
        '\n'
      ),
    };

    for (const text of Object.values(localizedText)) {
      for (const term of [
        '@geektech/tsone-cli',
        'tsone.config.ts',
        'server.proxy',
        'tsone dev',
        'tsone build',
        'defineConfig',
        'startDevServer',
      ]) {
        expect(text).toContain(term);
      }
    }

    for (const text of Object.values(localizedApiText)) {
      expect(text).toContain(
        'build(options?: BuildOptions): Promise<BuildResult>'
      );
    }
  });

  it('keeps development transport and v1 exclusions explicit in every docs surface', () => {
    const typedPaths = [
      '/guide/getting-started/',
      '/api/app/',
      '/contributing/',
    ];
    const englishSurfaces = [
      readFileSync(packagePath('../tsone-cli/README.md'), 'utf8'),
      readText('README.md'),
      ...typedPaths.map((path) => localizedDocsTextFor('en', [path])),
    ];
    const chineseSurfaces = [
      readText('README-zh.md'),
      ...typedPaths.map((path) => localizedDocsTextFor('zh', [path])),
    ];

    for (const text of englishSurfaces) {
      expectEnglishCliScope(text);
    }

    for (const text of chineseSurfaces) {
      expectChineseCliScope(text);
    }
  });

  it('detects inverse tooling-scope claims in review fixtures', () => {
    const englishFixture = [
      'The development server supports HTTPS.',
      'Proxy targets may use HTTP only.',
      'The development server supports HMR, WebSocket, and SSR.',
      'The build copies public/.',
      'The build configures minify and sourcemap.',
      'The configuration supports plugins.',
      'The CLI supports functional config.',
    ];
    const chineseFixture = [
      '开发服务器支持 HTTPS。',
      '代理目标仅支持 HTTP。',
      '开发服务器支持 HMR、WebSocket 和 SSR。',
      '构建复制 public/。',
      '构建配置 minify 和 sourcemap。',
      '配置支持 plugins。',
      'CLI 支持函数式配置。',
    ];

    expect(
      patternMatchCounts(englishFixture, ENGLISH_INVERSE_SCOPE_PATTERNS)
    ).toEqual([1, 1, 2, 1, 1, 1]);
    expect(
      patternMatchCounts(chineseFixture, CHINESE_INVERSE_SCOPE_PATTERNS)
    ).toEqual([1, 1, 2, 1, 1, 1]);
  });

  it('documents the complete CLI consumer contract in the CLI README', () => {
    const readme = readFileSync(packagePath('../tsone-cli/README.md'), 'utf8');

    for (const term of [
      'bun add @geektech/tsone @geektech/tsone-cli',
      'Bun `>=1.3.0`',
      'export const app',
      'renderHtmlDocument',
      'src/main.ts',
      '127.0.0.1',
      '52211',
      'dist',
      'tsone dev [--host <host>] [--port <port>] [--no-watch]',
      'tsone build [--out-dir <path>]',
      '--port=3000',
      '--no-watch',
      '/__tsone/reload',
      'watches the project by default',
      'defineConfig',
      'resolveConfig',
      'startDevServer',
      'server.stop()',
      'assetsBuilt',
      'longest',
      'changeOrigin',
      'rewrite',
      '502 Bad Gateway',
      'public/',
      'minify',
      'sourcemap',
    ]) {
      expect(readme).toContain(term);
    }

    expect(readme).toContain("'/backend': 'http://localhost:4000'");
    expect(readme).toContain("target: 'http://localhost:3000'");
    expect(readme).toContain("build: { outDir: 'dist' }");
    expect(readme).toContain(
      'The development server serves HTTP only. Proxy targets may use HTTP or HTTPS.'
    );
    expect(readme).toContain(
      'CLI v1 has no config plugins, WebSocket, HMR, SSR'
    );

    expect(readme).toContain('pages');
    expect(readme).toContain("'/about': 'src/about.ts'");
    expect(readme).toContain("'/docs/guide': 'src/guide.ts'");
    expect(readme).toContain('one HTML document per page');
    expect(readme).toContain('docs/guide.html');
  });

  it('mounts the exported app in the canonical CLI README entry', () => {
    const readme = readFileSync(packagePath('../tsone-cli/README.md'), 'utf8');
    const applicationEntry = readme.match(
      /## Application Entry\n([\s\S]*?)\n## Configuration/
    )?.[1];
    const entrySource = applicationEntry?.match(
      /```typescript\n([\s\S]*?)\n```/
    )?.[1];

    expect(entrySource).toBeDefined();
    expect(entrySource).toContain('export const app = createApp({');
    expect(entrySource?.trimEnd().endsWith('app.mount();')).toBe(true);
  });
});
