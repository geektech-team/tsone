import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'bun:test';
import { parseCliArgs, runCli } from '../src/cli';
import {
  GITHUB_URL,
  TSONE_CLI_VERSION,
  TSONE_FRAMEWORK_VERSION,
  createProject,
} from '../src/create';

const roots: string[] = [];

function makeRoot(name = 'tsone-app'): string {
  const parent = mkdtempSync(join(tmpdir(), 'tsone-cli-create-'));
  const root = join(parent, name);
  mkdirSync(root);
  roots.push(parent);
  return root;
}

function withWorkingDirectory<T>(
  root: string,
  callback: () => Promise<T>
): Promise<T> {
  const previous = process.cwd();
  process.chdir(root);

  return callback().finally(() => {
    process.chdir(previous);
  });
}

function captureConsoleLogs(): { logs: string[]; restore: () => void } {
  const originalLog = console.log;
  const logs: string[] = [];
  console.log = (...values: unknown[]) => {
    logs.push(values.join(' '));
  };

  return {
    logs,
    restore: () => {
      console.log = originalLog;
    },
  };
}

afterEach(() => {
  roots
    .splice(0)
    .forEach((root) => rmSync(root, { recursive: true, force: true }));
});

describe('TSone CLI create', () => {
  it('parses the create command without options', () => {
    expect(parseCliArgs(['create'])).toEqual({ command: 'create' });
  });

  it('rejects create options', () => {
    expect(() => parseCliArgs(['create', '--name', 'x'])).toThrow(
      'Unknown option: --name'
    );
  });

  it('scaffolds a TSone project in the target directory', () => {
    const root = makeRoot('my-app');
    const result = createProject({ root });

    expect(result.root).toBe(root);
    expect(result.files).toEqual([
      'package.json',
      'tsone.config.ts',
      'tsconfig.json',
      '.gitignore',
      'src/main.ts',
    ]);
    expect(existsSync(join(root, 'src', 'main.ts'))).toBe(true);

    const manifest = JSON.parse(
      readFileSync(join(root, 'package.json'), 'utf8')
    );
    expect(manifest.name).toBe('my-app');
    expect(manifest.private).toBe(true);
    expect(manifest.scripts).toEqual({
      dev: 'tsone dev',
      build: 'tsone build',
      typecheck: 'bunx tsc --noEmit',
    });
    expect(manifest.dependencies['@geektech/tsone']).toBe(
      `^${TSONE_FRAMEWORK_VERSION}`
    );
    expect(manifest.devDependencies['@geektech/tsone-cli']).toBe(
      `^${TSONE_CLI_VERSION}`
    );

    expect(readFileSync(join(root, 'tsone.config.ts'), 'utf8')).toContain(
      "entry: 'src/main.ts'"
    );
  });

  it('writes a homepage entry that displays TSone and the GitHub link', () => {
    const root = makeRoot();
    createProject({ root });

    const main = readFileSync(join(root, 'src', 'main.ts'), 'utf8');
    expect(main).toContain('export const app = createApp({');
    expect(main).toContain("h('h1'");
    expect(main).toContain("'TSone'");
    expect(main).toContain(`href: '${GITHUB_URL}'`);
    expect(main).toContain('GitHub');
  });

  it('refuses to overwrite existing project files', () => {
    const root = makeRoot();
    writeFileSync(join(root, 'package.json'), '{}');

    expect(() => createProject({ root })).toThrow(
      'Refusing to overwrite existing TSone project files: package.json'
    );
  });

  it('runs create from a programmatic CLI invocation in the current directory', async () => {
    const root = makeRoot('cli-app');
    const captured = captureConsoleLogs();

    try {
      await withWorkingDirectory(root, () => runCli(['create']));
    } finally {
      captured.restore();
    }

    expect(existsSync(join(root, 'src', 'main.ts'))).toBe(true);
    expect(captured.logs.join('\n')).toContain('TSone project created');
    expect(captured.logs.join('\n')).toContain(root);
  });

  it('keeps the scaffold dependency versions in sync with the packages', () => {
    const frameworkManifest = JSON.parse(
      readFileSync(
        join(import.meta.dir, '..', '..', 'tsone', 'package.json'),
        'utf8'
      )
    );
    const cliManifest = JSON.parse(
      readFileSync(join(import.meta.dir, '..', 'package.json'), 'utf8')
    );

    expect(TSONE_FRAMEWORK_VERSION).toBe(frameworkManifest.version);
    expect(TSONE_CLI_VERSION).toBe(cliManifest.version);
  });

  it('uses only symbols exported by the framework public API', async () => {
    const root = makeRoot();
    createProject({ root });
    const main = readFileSync(join(root, 'src', 'main.ts'), 'utf8');

    const frameworkEntryPath = join(
      import.meta.dir,
      '..',
      '..',
      'tsone',
      'lib',
      'index.ts'
    );
    const framework = await import(frameworkEntryPath);
    // Component / createApp / h are runtime values; VNode is a type-only import.
    for (const symbol of ['Component', 'createApp', 'h']) {
      expect(main).toContain(symbol);
      expect(framework[symbol as keyof typeof framework]).toBeDefined();
    }
    expect(main).toContain('type VNode');
  });
});
