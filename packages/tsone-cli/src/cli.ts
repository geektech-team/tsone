import { build } from './build';
import { createProject } from './create';
import { startDevServer } from './server';

const USAGE = [
  'Usage:',
  '  tsone create',
  '  tsone dev [--host <host>] [--port <port>] [--no-watch]',
  '  tsone build [--out-dir <path>] [--library]',
].join('\n');

const FLAG_OPTIONS = new Set(['--no-watch', '--library']);

export interface CreateCliArgs {
  command: 'create';
}

export interface DevCliArgs {
  command: 'dev';
  host?: string;
  port?: number;
  noWatch?: boolean;
}

export interface BuildCliArgs {
  command: 'build';
  outDir?: string;
  library?: boolean;
}

export type CliArgs = CreateCliArgs | DevCliArgs | BuildCliArgs;

export function parseCliArgs(argv: string[]): CliArgs {
  const command = argv[0];
  if (command !== 'create' && command !== 'dev' && command !== 'build') {
    throw parseError(
      command === undefined ? 'Missing command' : `Unknown command: ${command}`
    );
  }

  const options = new Map<string, string>();
  for (let index = 1; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      throw parseError(`Unexpected positional argument: ${token}`);
    }

    const { name, inlineValue } = splitOption(token);
    assertKnownOption(name);
    assertSupportedOption(command, name);
    if (options.has(name)) {
      throw parseError(`Duplicate option: ${name}`);
    }
    if (FLAG_OPTIONS.has(name)) {
      options.set(name, 'true');
      continue;
    }

    const value = inlineValue ?? argv[index + 1];
    if (value === undefined || value === '' || value.startsWith('--')) {
      throw parseError(`Missing value for option: ${name}`);
    }
    if (inlineValue === undefined) {
      index += 1;
    }
    options.set(name, value);
  }

  if (command === 'create') {
    return { command };
  }

  if (command === 'dev') {
    const port = options.get('--port');
    return {
      command,
      ...(options.has('--host') ? { host: options.get('--host') } : {}),
      ...(port === undefined ? {} : { port: parsePort(port) }),
      ...(options.has('--no-watch') ? { noWatch: true } : {}),
    };
  }

  return {
    command,
    ...(options.has('--out-dir') ? { outDir: options.get('--out-dir') } : {}),
    ...(options.has('--library') ? { library: true } : {}),
  };
}

export async function runCli(
  argv: string[] = process.argv.slice(2)
): Promise<void> {
  const args = parseCliArgs(argv);

  if (args.command === 'create') {
    const result = createProject();
    console.log(
      `TSone project created at ${result.root} (${result.files.length} files)`
    );
    return;
  }

  if (args.command === 'dev') {
    const server = await startDevServer({
      ...(args.host === undefined ? {} : { host: args.host }),
      ...(args.port === undefined ? {} : { port: args.port }),
      watch: !args.noWatch,
    });
    console.log(
      `TSone dev server listening at http://${server.hostname}:${server.port}`
    );
    return;
  }

  const result = await build(
    args.outDir === undefined && !args.library
      ? {}
      : { outDir: args.outDir, library: args.library }
  );
  console.log(
    `TSone build completed: ${result.outDir} (${result.assetsBuilt.length} assets)`
  );
}

function splitOption(token: string): { name: string; inlineValue?: string } {
  const equalsIndex = token.indexOf('=');
  if (equalsIndex === -1) {
    return { name: token };
  }

  return {
    name: token.slice(0, equalsIndex),
    inlineValue: token.slice(equalsIndex + 1),
  };
}

function assertKnownOption(name: string): void {
  if (
    name === '--host' ||
    name === '--port' ||
    name === '--out-dir' ||
    name === '--no-watch' ||
    name === '--library'
  ) {
    return;
  }

  throw parseError(`Unknown option: ${name}`);
}

function assertSupportedOption(
  command: CliArgs['command'],
  name: string
): void {
  const supported =
    (command === 'create' && false) ||
    (command === 'dev' &&
      (name === '--host' || name === '--port' || name === '--no-watch')) ||
    (command === 'build' &&
      (name === '--out-dir' || name === '--library'));

  if (!supported) {
    throw parseError(`Option ${name} is not supported for ${command}`);
  }
}

function parsePort(value: string): number {
  if (!/^\d+$/.test(value)) {
    throw parseError('Port must be an integer between 0 and 65535');
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw parseError('Port must be an integer between 0 and 65535');
  }

  return port;
}

function parseError(message: string): Error {
  return new Error(`${message}\n\n${USAGE}`);
}
