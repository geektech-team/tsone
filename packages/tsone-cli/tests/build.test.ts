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
import { afterEach, describe, expect, it } from 'bun:test';
import { build } from '../src/build';

const roots: string[] = [];
const externalDirectories: string[] = [];
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
  });

  it('rejects the project root as an output directory without deleting it', async () => {
    const root = makeRoot();

    await expect(build({ root, outDir: root })).rejects.toThrow(
      'Build output must be a subdirectory of the project root'
    );

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
