import { afterEach, expect, test } from 'bun:test';
import { mkdtempSync, writeFileSync, rmSync, realpathSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import ts from 'typescript';
import { discoverModules, RuntimeModuleGraph, sourcesUnchanged } from '../src/static-styles/module-graph';

const roots: string[] = [];
const framework = resolve(import.meta.dir, '../../tsone/lib/index.ts');
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
function fixture(source: string): { root: string; entry: string } {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'tsone-graph-')));
  roots.push(root);
  const entry = join(root, 'main.ts');
  writeFileSync(join(root, 'barrel.ts'), `export { Component as Base } from ${JSON.stringify(framework)};`);
  writeFileSync(entry, source);
  return { root, entry };
}

test('uses Bun-resolved barrel aliases to certify framework inheritance', async () => {
  const { entry, root } = fixture(`import { Base as Parent } from './barrel';
    export class Widget extends Parent { initState(){return {}} initStyles(){} render(){return {tag:'div'}} }`);
  const discovery = await discoverModules({ entrypoints: [entry], target: 'browser', format: 'esm' });
  expect(discovery.modules.get(entry)!.imports.get('./barrel')).toBe(join(root, 'barrel.ts'));
  const graph = new RuntimeModuleGraph(discovery);
  const declaration = graph.getSourceFile(entry)!.statements.find(ts.isClassDeclaration)!;
  expect(graph.isFrameworkConstructor(declaration.heritageClauses![0].types[0].expression, 'Component')).toBe(true);
  expect(await sourcesUnchanged(discovery)).toBe(true);
  writeFileSync(entry, 'export const changed = true');
  expect(await sourcesUnchanged(discovery)).toBe(false);
});

test('rejects same-name classes and graphs without resolution evidence', async () => {
  const { entry } = fixture('class Component {} export class Widget extends Component {}');
  const discovery = await discoverModules({ entrypoints: [entry], target: 'browser' });
  for (const evidence of [discovery, { ...discovery, hasResolvedImports: false }]) {
    const graph = new RuntimeModuleGraph(evidence);
    const declaration = graph.getSourceFile(entry)!.statements.filter(ts.isClassDeclaration)[1];
    expect(graph.isFrameworkConstructor(declaration.heritageClauses![0].types[0].expression, 'Component')).toBe(false);
  }
});

test('tracks reassignment and object mutation instead of assuming const is fixed', async () => {
  const { entry } = fixture('export let fixed = 1; export const changed = {color: "red"}; changed.color = "blue";');
  const graph = new RuntimeModuleGraph(await discoverModules({ entrypoints: [entry], target: 'browser' }));
  const variables = graph.getSourceFile(entry)!.statements.filter(ts.isVariableStatement)
    .flatMap(statement => [...statement.declarationList.declarations]);
  expect(graph.hasObservableMutation(variables[0])).toBe(false);
  expect(graph.hasObservableMutation(variables[1])).toBe(true);
});

test('certifies Bun tsconfig and browser-export resolution rather than type paths', async () => {
  const { entry, root } = fixture(`import { Base } from '@base'; import { value } from 'conditional'; export { Base, value };`);
  writeFileSync(join(root, 'tsconfig.json'), JSON.stringify({ compilerOptions: { paths: { '@base': ['./barrel.ts'] } } }));
  const dependency = join(root, 'node_modules/conditional');
  mkdirSync(dependency, { recursive: true });
  writeFileSync(join(dependency, 'package.json'), JSON.stringify({ name: 'conditional', exports: { browser: './browser.ts', default: './default.ts' } }));
  writeFileSync(join(dependency, 'browser.ts'), 'export const value = "browser";');
  writeFileSync(join(dependency, 'default.ts'), 'export const value = "default";');
  const discovery = await discoverModules({ entrypoints: [entry], target: 'browser' });
  expect(discovery.modules.get(entry)!.imports.get('@base')).toBe(join(root, 'barrel.ts'));
  expect(discovery.modules.get(entry)!.imports.get('conditional')).toBe(join(dependency, 'browser.ts'));
});

test('two framework package copies and cyclic aliases fall back completely', async () => {
  const { entry, root } = fixture(`import { Component as A } from './a'; import { Component as B } from './b'; export {A,B};`);
  for (const name of ['a', 'b']) {
    mkdirSync(join(root, name));
    writeFileSync(join(root, name, 'package.json'), '{"name":"@geektech/tsone"}');
    writeFileSync(join(root, name, 'index.ts'), 'export class Component {}');
  }
  const discovery = await discoverModules({ entrypoints: [entry], target: 'browser' });
  const graph = new RuntimeModuleGraph(discovery);
  const file = graph.getSourceFile(entry)!;
  const specifier = (file.statements[0] as ts.ImportDeclaration).importClause!.namedBindings as ts.NamedImports;
  expect(graph.isFrameworkConstructor(specifier.elements[0].name, 'Component')).toBe(false);
});
