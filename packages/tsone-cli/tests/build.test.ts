import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'bun:test';
import { build } from '../src/build';

const roots: string[] = [];
const externalDirectories: string[] = [];
const restorers: Array<() => void> = [];
type BunBuildResult = Awaited<ReturnType<typeof Bun.build>>;
type BunBuildOutput = BunBuildResult['outputs'][number];
const frameworkEntryPath = join(
  import.meta.dir,
  '..',
  '..',
  'tsone',
  'lib',
  'index.ts'
);

function makeRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'tsone-cli-build-'));
  roots.push(root);
  mkdirSync(join(root, 'src'));
  writeFileSync(
    join(root, 'src', 'site.css'),
    'body { color: rebeccapurple; }'
  );
  writeFileSync(
    join(root, 'src', 'main.ts'),
    `
      import './site.css';
      import { createApp } from '${frameworkEntryPath}';

      export const app = createApp({
        document: { title: 'Built TSone App' },
      });
    `
  );
  writeFileSync(join(root, 'root-sentinel.txt'), 'root remains');
  return root;
}

function makeExternalDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'tsone-cli-external-'));
  externalDirectories.push(directory);
  writeFileSync(join(directory, 'external-sentinel.txt'), 'external remains');
  return directory;
}

function createBuildOutput(
  path: string,
  contents: string,
  kind: BunBuildOutput['kind'],
  type: string
): BunBuildOutput {
  return Object.assign(new Blob([contents], { type }), {
    path,
    kind,
    hash: 'test-output-hash',
    sourcemap: null,
  }) as BunBuildOutput;
}

function mockBuild(result: BunBuildResult): void {
  const originalBuild = Bun.build;
  Bun.build = (async () => result) as typeof Bun.build;
  restorers.push(() => {
    Bun.build = originalBuild;
  });
}

function mockRejectedBuild(error: Error): void {
  const originalBuild = Bun.build;
  Bun.build = (async () => {
    throw error;
  }) as typeof Bun.build;
  restorers.push(() => {
    Bun.build = originalBuild;
  });
}

function expectSentinelsToRemain(root: string, external?: string): void {
  expect(readFileSync(join(root, 'src', 'main.ts'), 'utf8')).toContain(
    "import './site.css';"
  );
  expect(readFileSync(join(root, 'root-sentinel.txt'), 'utf8')).toBe(
    'root remains'
  );
  if (external) {
    expect(readFileSync(join(external, 'external-sentinel.txt'), 'utf8')).toBe(
      'external remains'
    );
  }
}

afterEach(() => {
  restorers
    .splice(0)
    .reverse()
    .forEach((restore) => restore());
  roots
    .splice(0)
    .forEach((root) => rmSync(root, { recursive: true, force: true }));
  externalDirectories
    .splice(0)
    .forEach((directory) =>
      rmSync(directory, { recursive: true, force: true })
    );
});

describe('TSone production build', () => {
  it('cleans stale output, bundles assets, and writes an application document', async () => {
    const root = makeRoot();
    mkdirSync(join(root, 'dist'));
    writeFileSync(join(root, 'dist', 'stale.txt'), 'stale');

    const result = await build({ root });
    const html = readFileSync(join(root, 'dist', 'index.html'), 'utf8');

    expect(existsSync(join(root, 'dist', 'stale.txt'))).toBe(false);
    expect(existsSync(join(root, 'dist', 'main.js'))).toBe(true);
    expect(readFileSync(join(root, 'dist', 'main.js'), 'utf8')).not.toBe('');
    expect(existsSync(join(root, 'dist', 'main.css'))).toBe(true);
    expect(readFileSync(join(root, 'dist', 'main.css'), 'utf8')).toContain(
      'color:'
    );
    expect(result).toEqual({
      root,
      outDir: join(root, 'dist'),
      assetsBuilt: expect.arrayContaining([
        join(root, 'dist', 'index.html'),
        join(root, 'dist', 'main.js'),
        join(root, 'dist', 'main.css'),
      ]),
    });
    expect(html).toContain('<title>Built TSone App</title>');
    expect(html).toContain('<script type="module" src="./main.js"></script>');
    expect(html).toContain('<link rel="stylesheet" href="./main.css">');
    const documentUrl = pathToFileURL(join(root, 'dist', 'index.html'));
    const scriptSource = html.match(
      /<script type="module" src="([^"]+)"><\/script>/
    )?.[1];
    const stylesheetHref = html.match(
      /<link rel="stylesheet" href="([^"]+)">/
    )?.[1];

    if (!scriptSource || !stylesheetHref) {
      throw new Error('Expected build document assets');
    }

    expect(fileURLToPath(new URL(scriptSource, documentUrl))).toBe(
      join(root, 'dist', 'main.js')
    );
    expect(existsSync(fileURLToPath(new URL(scriptSource, documentUrl)))).toBe(
      true
    );
    expect(fileURLToPath(new URL(stylesheetHref, documentUrl))).toBe(
      join(root, 'dist', 'main.css')
    );
    expect(
      existsSync(fileURLToPath(new URL(stylesheetHref, documentUrl)))
    ).toBe(true);
  });

  it('reports a failed Bun build even when it emitted JavaScript without logs', async () => {
    const root = makeRoot();
    mockBuild({
      success: false,
      logs: [],
      outputs: [
        createBuildOutput(
          join(root, 'dist', 'main.js'),
          'export const failedBuild = true;',
          'entry-point',
          'text/javascript;charset=utf-8'
        ),
      ],
    } as BunBuildResult);

    await expect(build({ root })).rejects.toThrow('Bun build reported failure');
    expect(existsSync(join(root, 'dist', 'index.html'))).toBe(false);
  });

  it('adds TSone build context when Bun rejects unexpectedly', async () => {
    const root = makeRoot();
    mockRejectedBuild(new Error('unexpected bundler rejection'));

    await expect(build({ root })).rejects.toThrow(
      'Failed to build TSone application: unexpected bundler rejection'
    );
    expect(existsSync(join(root, 'dist', 'index.html'))).toBe(false);
  });

  it('reports when Bun emits no output files', async () => {
    const root = makeRoot();
    mockBuild({ success: true, logs: [], outputs: [] } as BunBuildResult);

    await expect(build({ root })).rejects.toThrow(
      'Bun emitted no output files'
    );
    expect(existsSync(join(root, 'dist', 'index.html'))).toBe(false);
  });

  it('reports when Bun emits CSS without JavaScript', async () => {
    const root = makeRoot();
    mockBuild({
      success: true,
      logs: [],
      outputs: [
        createBuildOutput(
          join(root, 'dist', 'main.css'),
          'body { color: rebeccapurple; }',
          'asset',
          'text/css;charset=utf-8'
        ),
      ],
    } as BunBuildResult);

    await expect(build({ root })).rejects.toThrow(
      'Bun emitted no JavaScript output'
    );
    expect(existsSync(join(root, 'dist', 'index.html'))).toBe(false);
  });

  it('does not execute JavaScript outputs classified as assets', async () => {
    const root = makeRoot();
    const entryPoint = join(root, 'dist', 'main.js');
    const javascriptAsset = join(root, 'dist', 'worker.js');
    mockBuild({
      success: true,
      logs: [],
      outputs: [
        createBuildOutput(
          entryPoint,
          'export const appEntry = true;',
          'entry-point',
          'text/javascript;charset=utf-8'
        ),
        createBuildOutput(
          javascriptAsset,
          'self.postMessage("asset");',
          'asset',
          'text/javascript;charset=utf-8'
        ),
      ],
    } as BunBuildResult);

    const result = await build({ root });
    const html = readFileSync(join(root, 'dist', 'index.html'), 'utf8');

    expect(result.assetsBuilt).toEqual(
      expect.arrayContaining([
        entryPoint,
        javascriptAsset,
        join(root, 'dist', 'index.html'),
      ])
    );
    expect(html).toContain('<script type="module" src="./main.js"></script>');
    expect(html).not.toContain('src="./worker.js"');
  });

  it('builds successfully through a project-root symlink', async () => {
    const root = makeRoot();
    const linkedRoot = `${root}-link`;
    symlinkSync(root, linkedRoot);
    roots.push(linkedRoot);

    const result = await build({ root: linkedRoot });

    expect(result.outDir).toBe(join(linkedRoot, 'dist'));
    expect(existsSync(join(root, 'dist', 'index.html'))).toBe(true);
  });

  it('rejects the project root as an output directory without deleting it', async () => {
    const root = makeRoot();

    await expect(build({ root, outDir: root })).rejects.toThrow(
      'Build output must be a subdirectory of the project root'
    );

    expectSentinelsToRemain(root);
  });

  it('rejects an output directory that contains the entry without deleting source files', async () => {
    const root = makeRoot();
    const sourceSentinel = join(root, 'src', 'source-sentinel.txt');
    writeFileSync(sourceSentinel, 'source remains');

    await expect(build({ root, outDir: 'src' })).rejects.toThrow(
      'Build output must be a subdirectory of the project root'
    );

    expectSentinelsToRemain(root);
    expect(readFileSync(sourceSentinel, 'utf8')).toBe('source remains');
  });

  it('canonically rejects an output routed through a symlink to the entry directory', async () => {
    const root = makeRoot();
    const sourceSentinel = join(root, 'src', 'source-sentinel.txt');
    writeFileSync(sourceSentinel, 'source remains');
    symlinkSync(root, join(root, 'linked-root'));

    await expect(build({ root, outDir: 'linked-root/src' })).rejects.toThrow(
      'Build output must be a subdirectory of the project root'
    );

    expectSentinelsToRemain(root);
    expect(readFileSync(sourceSentinel, 'utf8')).toBe('source remains');
  });

  it('allows a child output directory that does not contain the entry', async () => {
    const root = makeRoot();

    const result = await build({ root, outDir: 'src/dist' });

    expect(result.outDir).toBe(join(root, 'src', 'dist'));
    expect(existsSync(join(root, 'src', 'dist', 'index.html'))).toBe(true);
    expectSentinelsToRemain(root);
  });

  it('rejects an output directory outside the project without deleting sentinels', async () => {
    const root = makeRoot();
    const external = makeExternalDirectory();

    await expect(build({ root, outDir: external })).rejects.toThrow(
      'Build output must be a subdirectory of the project root'
    );

    expectSentinelsToRemain(root, external);
  });

  it('rejects an existing output symlink that targets outside the project', async () => {
    const root = makeRoot();
    const external = makeExternalDirectory();
    symlinkSync(external, join(root, 'dist'));

    await expect(build({ root })).rejects.toThrow(
      'Build output must be a subdirectory of the project root'
    );

    expectSentinelsToRemain(root, external);
  });

  it('rejects a parent symlink that routes output outside the project', async () => {
    const root = makeRoot();
    const external = makeExternalDirectory();
    symlinkSync(external, join(root, 'linked-output'));

    await expect(build({ root, outDir: 'linked-output/dist' })).rejects.toThrow(
      'Build output must be a subdirectory of the project root'
    );

    expectSentinelsToRemain(root, external);
  });
});
