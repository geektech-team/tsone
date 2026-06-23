import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'bun:test';
import { docPages, docText } from '../docs/app/content';

const root = process.cwd();

function readText(path: string): string {
  return readFileSync(join(root, path), 'utf8');
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
      'reactive',
      'effect',
      'computed',
    ]) {
      expect(readme).toContain(symbol);
    }

    expect(appApi).toContain('root');
    expect(appApi).toContain('createApp({ root: App');
    expect(componentApi).toContain('Component<Props, State>');
    expect(componentApi).toContain('protected render(): VNode');
    expect(reactiveApi).toContain('computed');
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
});
