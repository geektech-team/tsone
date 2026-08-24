import { rm } from 'node:fs/promises';

async function run(command: string[]): Promise<void> {
  const proc = Bun.spawn(command, {
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    throw new Error(`${command.join(' ')} failed with exit code ${exitCode}`);
  }
}

await rm('dist', { recursive: true, force: true });
await run(['bunx', 'tsc', '--project', 'tsconfig.build.json']);

const result = await Bun.build({
  entrypoints: [
    './lib/index.ts',
    './lib/router/index.ts',
    './lib/style/index.ts',
  ],
  outdir: './dist',
  root: './lib',
  target: 'browser',
  format: 'esm',
  sourcemap: 'linked',
  splitting: true,
  naming: {
    entry: '[dir]/[name].js',
    chunk: '[name]-[hash].js',
  },
});

if (!result.success) {
  result.logs.forEach((log) => {
    console.error(log);
  });
  throw new Error('Bun.build failed');
}

console.log(`Built ${result.outputs.length} artifacts with Bun.`);
