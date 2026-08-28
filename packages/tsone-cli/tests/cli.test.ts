import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'bun:test';
import { parseCliArgs, runCli } from '../src/cli';

const roots: string[] = [];
const frameworkEntryPath = join(
  import.meta.dir,
  '..',
  '..',
  'tsone',
  'lib',
  'index.ts'
);
const cliBinPath = join(import.meta.dir, '..', 'bin', 'tsone.ts');
const cliDistPath = join(import.meta.dir, '..', 'dist');
const hiddenCliDistPath = `${cliDistPath}-cli-test-hidden`;

function makeRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'tsone-cli-command-'));
  roots.push(root);
  mkdirSync(join(root, 'src'));
  writeFileSync(
    join(root, 'src', 'main.ts'),
    `
      import { createApp } from '${frameworkEntryPath}';

      export const app = createApp({
        document: { title: 'CLI Test App' },
      });
    `
  );
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
  if (existsSync(hiddenCliDistPath)) {
    renameSync(hiddenCliDistPath, cliDistPath);
  }
});

describe('TSone CLI arguments', () => {
  it('parses dev options in separated form', () => {
    expect(
      parseCliArgs(['dev', '--host', '0.0.0.0', '--port', '4300'])
    ).toEqual({
      command: 'dev',
      host: '0.0.0.0',
      port: 4300,
    });
  });

  it('parses build options in equals form', () => {
    expect(parseCliArgs(['build', '--out-dir=output'])).toEqual({
      command: 'build',
      outDir: 'output',
    });
  });

  it('rejects invalid commands and options with both usage lines', () => {
    expect(() => parseCliArgs(['preview'])).toThrow('Unknown command: preview');
    expect(() => parseCliArgs(['dev', '--open'])).toThrow(
      'Unknown option: --open'
    );
    expect(() => parseCliArgs(['build', '--host', 'localhost'])).toThrow(
      'Option --host is not supported for build'
    );
    expect(() => parseCliArgs(['dev', '--port'])).toThrow(
      'Missing value for option: --port'
    );
    expect(() => parseCliArgs(['dev', '--port=1.5'])).toThrow(
      'Port must be an integer between 0 and 65535'
    );
    expect(() => parseCliArgs(['dev', '--port', '65536'])).toThrow(
      'Port must be an integer between 0 and 65535'
    );
    expect(() => parseCliArgs(['build', 'output'])).toThrow(
      'Unexpected positional argument: output'
    );
    expect(() =>
      parseCliArgs(['build', '--out-dir', 'one', '--out-dir=two'])
    ).toThrow('Duplicate option: --out-dir');
    expect(() => parseCliArgs(['dev', '--open'])).toThrow(
      'tsone dev [--host <host>] [--port <port>]\n  tsone build [--out-dir <path>]'
    );
  });

  it('runs builds from a programmatic invocation and reports output details', async () => {
    const root = makeRoot();
    const captured = captureConsoleLogs();

    try {
      await withWorkingDirectory(root, () =>
        runCli(['build', '--out-dir', 'output'])
      );
    } finally {
      captured.restore();
    }

    expect(existsSync(join(root, 'output', 'index.html'))).toBe(true);
    expect(captured.logs.join('\n')).toContain(join(root, 'output'));
    expect(captured.logs.join('\n')).toContain('assets');
  });

  it('falls back to the source CLI in a fresh workspace when dist is absent', async () => {
    const root = makeRoot();
    if (existsSync(cliDistPath)) {
      renameSync(cliDistPath, hiddenCliDistPath);
    }

    const child = Bun.spawn({
      cmd: [process.execPath, cliBinPath, 'build', '--out-dir', 'output'],
      cwd: root,
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const [exitCode, stdout, stderr] = await Promise.all([
      child.exited,
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
    ]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain('assets');
    expect(stderr).toBe('');
    expect(readFileSync(join(root, 'output', 'index.html'), 'utf8')).toContain(
      '<title>CLI Test App</title>'
    );
  });
});
