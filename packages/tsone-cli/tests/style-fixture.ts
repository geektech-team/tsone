import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { discoverModules, RuntimeModuleGraph } from '../src/static-styles/module-graph';

export const frameworkSource = resolve(import.meta.dir, '../../tsone/lib/index.ts');
export async function withStyleGraph<T>(source: string,
  run: (graph: RuntimeModuleGraph, entry: string) => T | Promise<T>): Promise<T> {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'tsone-style-')));
  const entry = join(root, 'main.ts');
  try {
    writeFileSync(entry, source);
    const discovery = await discoverModules({ entrypoints: [entry], target: 'browser', format: 'esm' });
    return await run(new RuntimeModuleGraph(discovery), entry);
  } finally { rmSync(root, { recursive: true, force: true }); }
}
