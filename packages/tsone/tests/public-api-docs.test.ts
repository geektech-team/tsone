import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'bun:test';
import * as publicApi from '../lib';
import * as routerApi from '../lib/router';
import { docPages, docText } from '../docs/app/content';
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
      'Chinese and English catalogs each contain exactly 14 logical routes'
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
    expect(chineseReadme).toContain('中英文 catalog 当前各包含 14 条逻辑路由');
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
      'VNode',
      'renderHtmlDocument',
      'StyleSheet',
      'reactive',
      'effect',
      'computed',
      'isRef',
      'unref',
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
});
