import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { isEntryJavaScriptOutput, isStylesheetOutput } from './build-output';
import { resolveConfig } from './config';
import { renderProjectHtml } from './project';
import { assertSafeSubdirectoryDoesNotContain } from './safe-path';
import type { BuildOptions, BuildResult } from './types';

const INVALID_OUTPUT_DIRECTORY_MESSAGE =
  'Build output must be a subdirectory of the project root';

interface BuiltPage {
  entry: string;
  assets: string[];
  javascriptAssets: string[];
  stylesheetAssets: string[];
}

export async function build(options: BuildOptions = {}): Promise<BuildResult> {
  const config = await resolveConfig(options);
  if (options.library) {
    return buildLibrary(config);
  }

  const entries = [...new Set(Object.values(config.pages))];

  for (const entry of entries) {
    await assertSafeSubdirectoryDoesNotContain(
      config.root,
      config.build.outDir,
      entry,
      INVALID_OUTPUT_DIRECTORY_MESSAGE
    );
  }
  for (const [route, entry] of Object.entries(config.pages)) {
    await renderProjectHtml(config, {}, entry, route);
  }

  await rm(config.build.outDir, { recursive: true, force: true });
  await mkdir(config.build.outDir, { recursive: true });

  const builtByEntry = new Map<string, BuiltPage>();
  const failures: string[] = [];
  for (const entry of entries) {
    const built = await buildPage(config, entry);
    if (typeof built === 'string') {
      failures.push(built);
      continue;
    }
    builtByEntry.set(entry, built);
  }
  if (failures.length > 0) {
    throw buildFailure(failures);
  }

  const assetsBuilt: string[] = [];
  for (const [route, entry] of Object.entries(config.pages)) {
    const page = builtByEntry.get(entry);
    if (!page) {
      throw new Error(`Missing built assets for entry: ${entry}`);
    }
    const pageHtmlPath = htmlPath(config, route);
    const html = await renderProjectHtml(
      config,
      {
        head: page.stylesheetAssets.map((asset) => ({
          tag: 'link',
          attributes: {
            rel: 'stylesheet',
            href: toAssetUrl(config.build.outDir, pageHtmlPath, asset),
          },
        })),
        scripts: page.javascriptAssets.map((asset) => ({
          type: 'module',
          src: toAssetUrl(config.build.outDir, pageHtmlPath, asset),
        })),
      },
      page.entry,
      route
    );
    await mkdir(dirname(pageHtmlPath), { recursive: true });
    await writeFile(pageHtmlPath, html);
    assetsBuilt.push(...page.assets, pageHtmlPath);
  }

  return {
    root: config.root,
    outDir: config.build.outDir,
    assetsBuilt,
  };
}

async function buildLibrary(
  config: Awaited<ReturnType<typeof resolveConfig>>
): Promise<BuildResult> {
  const library = config.library;
  if (!library) {
    throw new Error('TSone library build requires config.library');
  }

  await rm(library.outDir, { recursive: true, force: true });
  await mkdir(library.outDir, { recursive: true });

  if (library.dts) {
    for (const tsconfig of library.tsconfigs) {
      await runTsc(config.root, tsconfig);
    }
  }

  const minify = library.minify ?? process.env.TSONE_MINIFY !== '0';
  const result = await Bun.build({
    entrypoints: [library.entry],
    outdir: library.outDir,
    root: dirname(library.entry),
    target: 'browser',
    format: 'esm',
    sourcemap: library.sourcemap ? 'linked' : undefined,
    splitting: library.splitting,
    minify,
    external: library.external,
    throw: false,
  });

  if (!result.success || result.outputs.length === 0) {
    throw new Error(
      `Failed to build TSone library:\n${result.logs
        .map((log) => log.message)
        .join('\n')}`
    );
  }

  const assetsBuilt = result.outputs.map((output) => resolve(output.path));
  return { root: config.root, outDir: library.outDir, assetsBuilt };
}

async function runTsc(root: string, tsconfig: string): Promise<void> {
  const proc = Bun.spawn(['bunx', 'tsc', '--project', tsconfig], {
    cwd: root,
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(
      `tsc --project ${tsconfig} failed with exit code ${exitCode}`
    );
  }
}

async function buildPage(
  config: Awaited<ReturnType<typeof resolveConfig>>,
  entry: string
): Promise<BuiltPage | string> {
  let result: Awaited<ReturnType<typeof Bun.build>>;
  try {
    result = await Bun.build({
      entrypoints: [entry],
      outdir: config.build.outDir,
      target: 'browser',
      format: 'esm',
      // 生产构建默认压缩；TSONE_MINIFY=0 时生成未压缩产物，便于排查问题
      minify: process.env.TSONE_MINIFY !== '0',
      naming: { entry: '[name].[ext]', chunk: '[name]-[hash].[ext]' },
      throw: false,
    });
  } catch (error: unknown) {
    return pageFailureReason(entry, [errorMessage(error)]);
  }
  const assets = result.outputs.map((output) => resolve(output.path));
  const javascriptAssets = result.outputs
    .filter(isEntryJavaScriptOutput)
    .map((output) => resolve(output.path));
  const stylesheetAssets = result.outputs
    .filter(isStylesheetOutput)
    .map((output) => resolve(output.path));

  if (!result.success || assets.length === 0 || javascriptAssets.length === 0) {
    return pageFailureReason(
      entry,
      result.logs.map((log) => log.message),
      {
        success: result.success,
        hasOutput: assets.length > 0,
        hasJavaScript: javascriptAssets.length > 0,
      }
    );
  }

  return {
    entry,
    assets,
    javascriptAssets,
    stylesheetAssets,
  };
}

function pageFailureReason(
  entry: string,
  logs: string[],
  state?: { success: boolean; hasOutput: boolean; hasJavaScript: boolean }
): string {
  const reasons = [
    state && !state.success ? 'Bun build reported failure' : '',
    state && !state.hasOutput ? 'Bun emitted no output files' : '',
    state && !state.hasJavaScript ? 'Bun emitted no JavaScript output' : '',
    ...logs,
  ].filter((reason) => reason !== '');

  return `${entry}: ${reasons.join('\n')}`;
}

function buildFailure(failures: string[]): Error {
  if (failures.length === 1) {
    return new Error(`Failed to build TSone application: ${failures[0]}`);
  }
  return new Error(
    `Failed to build TSone application:\n${failures
      .map((failure) => `- ${failure}`)
      .join('\n')}`
  );
}

function htmlPath(
  config: Awaited<ReturnType<typeof resolveConfig>>,
  route: string
): string {
  if (route === '/') {
    return resolve(config.build.outDir, 'index.html');
  }
  const relativeRoute = route.replace(/^\/+/, '');
  if (config.build.directoryPages) {
    return resolve(config.build.outDir, relativeRoute, 'index.html');
  }
  return resolve(config.build.outDir, `${relativeRoute}.html`);
}

function toAssetUrl(
  outDir: string,
  fromHtmlFile: string,
  asset: string
): string {
  const fromOutDir = relative(outDir, asset).split(sep).join('/');
  if (
    fromOutDir === '' ||
    fromOutDir === '..' ||
    fromOutDir.startsWith('../') ||
    isAbsolute(fromOutDir)
  ) {
    throw new Error(
      `Build asset must be inside the output directory: ${asset}`
    );
  }

  const fromHtmlDir = dirname(fromHtmlFile);
  const assetPath = relative(fromHtmlDir, asset).split(sep).join('/');
  return `./${assetPath}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
