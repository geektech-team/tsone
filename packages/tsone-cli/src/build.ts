import { lstat, mkdir, realpath, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { resolveConfig } from './config';
import { renderProjectHtml } from './project';
import type { BuildOptions, BuildResult } from './types';

const INVALID_OUTPUT_DIRECTORY_MESSAGE =
  'Build output must be a subdirectory of the project root';

export async function build(options: BuildOptions = {}): Promise<BuildResult> {
  const config = await resolveConfig(options);

  await renderProjectHtml(config, {
    scripts: [{ type: 'module', src: './main.js' }],
  });
  await assertSafeOutputDirectory(config.root, config.build.outDir);

  await rm(config.build.outDir, { recursive: true, force: true });
  await mkdir(config.build.outDir, { recursive: true });

  const result = await Bun.build({
    entrypoints: [config.entry],
    outdir: config.build.outDir,
    target: 'browser',
    format: 'esm',
    naming: { entry: '[name].[ext]', chunk: '[name]-[hash].[ext]' },
  });
  const assetsBuilt = result.outputs.map((output) => resolve(output.path));
  const javascriptAssets = assetsBuilt.filter(isJavaScriptAsset);
  const stylesheetAssets = assetsBuilt.filter(isStylesheetAsset);

  if (
    !result.success ||
    assetsBuilt.length === 0 ||
    javascriptAssets.length === 0
  ) {
    throw buildFailure(
      result.logs.map((log) => log.message),
      {
        hasOutput: assetsBuilt.length > 0,
        hasJavaScript: javascriptAssets.length > 0,
      }
    );
  }

  const html = await renderProjectHtml(config, {
    head: stylesheetAssets.map((asset) => ({
      tag: 'link',
      attributes: {
        rel: 'stylesheet',
        href: toAssetUrl(config.build.outDir, asset),
      },
    })),
    scripts: javascriptAssets.map((asset) => ({
      type: 'module',
      src: toAssetUrl(config.build.outDir, asset),
    })),
  });
  const indexHtml = resolve(config.build.outDir, 'index.html');
  await writeFile(indexHtml, html);

  return {
    root: config.root,
    outDir: config.build.outDir,
    assetsBuilt: [...assetsBuilt, indexHtml],
  };
}

async function assertSafeOutputDirectory(
  root: string,
  outDir: string
): Promise<void> {
  try {
    const canonicalRoot = await realpath(root);
    const canonicalOutDir = await canonicalizePotentialPath(outDir);

    if (!isSubdirectory(canonicalRoot, canonicalOutDir)) {
      throw new Error(INVALID_OUTPUT_DIRECTORY_MESSAGE);
    }
  } catch {
    throw new Error(INVALID_OUTPUT_DIRECTORY_MESSAGE);
  }
}

async function canonicalizePotentialPath(path: string): Promise<string> {
  const ancestor = await findExistingAncestor(path);
  const canonicalAncestor = await realpath(ancestor);
  return resolve(canonicalAncestor, relative(ancestor, path));
}

async function findExistingAncestor(path: string): Promise<string> {
  let candidate = path;

  while (candidate !== dirname(candidate)) {
    try {
      await lstat(candidate);
      return candidate;
    } catch (error: unknown) {
      if (!isMissingPathError(error)) {
        throw error;
      }
    }

    candidate = dirname(candidate);
  }

  await lstat(candidate);
  return candidate;
}

function isMissingPathError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}

function isSubdirectory(root: string, path: string): boolean {
  const pathFromRoot = relative(root, path);
  return (
    pathFromRoot !== '' &&
    pathFromRoot !== '..' &&
    !pathFromRoot.startsWith(`..${sep}`) &&
    !isAbsolute(pathFromRoot)
  );
}

function isJavaScriptAsset(path: string): boolean {
  return /\.(?:[cm]?js)$/i.test(path);
}

function isStylesheetAsset(path: string): boolean {
  return /\.css$/i.test(path);
}

function toAssetUrl(outDir: string, asset: string): string {
  const assetPath = relative(outDir, asset).split(sep).join('/');
  if (assetPath === '' || assetPath === '..' || assetPath.startsWith('../')) {
    throw new Error(
      `Build asset must be inside the output directory: ${asset}`
    );
  }

  return `./${assetPath}`;
}

function buildFailure(
  logs: string[],
  state: { hasOutput: boolean; hasJavaScript: boolean }
): Error {
  const reasons = [
    !state.hasOutput ? 'Bun emitted no output files' : '',
    !state.hasJavaScript ? 'Bun emitted no JavaScript output' : '',
    ...logs,
  ].filter((reason) => reason !== '');

  return new Error(
    `Failed to build TSone application${
      reasons.length > 0 ? `: ${reasons.join('\n')}` : ''
    }`
  );
}
