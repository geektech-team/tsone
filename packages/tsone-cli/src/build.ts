import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { isEntryJavaScriptOutput, isStylesheetOutput } from './build-output';
import { resolveConfig } from './config';
import { assertSafeSubdirectoryDoesNotContain } from './safe-path';
import type { BuildOptions, BuildResult } from './types';
import {
  discoverModules,
  RuntimeModuleGraph,
  sourcesUnchanged,
  type Discovery,
} from './static-styles/module-graph';
import {
  analyzeFixedStyles,
  transformStaticStyles,
  type FixedStyleGroup,
} from './static-styles/analyze';
import {
  canExternalizeCss,
  externalizeDocumentStyles,
  makeStaticStyleAsset,
  writeStaticStyleAssets,
  type StaticStyleAsset,
} from './static-styles/assets';

const INVALID_OUTPUT_DIRECTORY_MESSAGE =
  'Build output must be a subdirectory of the project root';

interface BuiltPage {
  entry: string;
  assets: string[];
  javascriptAssets: string[];
  stylesheetAssets: string[];
  staticStyles: StaticStyleAsset[];
}

interface PreparedStyles {
  discovery: Discovery;
  groups: FixedStyleGroup[];
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
  // 动态加载：project.ts 依赖 '@geektech/tsone/dom'（框架 dist 的 DOM 渲染
  // 模块），仅在站点渲染路径需要。库构建（--library）不应被其拖累。
  const { renderProjectHtml } = await import('./project');
  for (const [route, entry] of Object.entries(config.pages)) {
    await renderProjectHtml(config, {}, entry, route);
  }

  const prepared = new Map<string, PreparedStyles>();
  for (const entry of entries) {
    let discovery: Discovery;
    try {
      discovery = await discoverModules(pageBuildOptions(config, entry));
    } catch (error) {
      throw buildFailure([pageFailureReason(entry, [errorMessage(error)])]);
    }
    const groups = analyzeFixedStyles(new RuntimeModuleGraph(discovery)).filter(
      (group) => canExternalizeCss(group.cssText)
    );
    prepared.set(entry, { discovery, groups });
  }

  await rm(config.build.outDir, { recursive: true, force: true });
  await mkdir(config.build.outDir, { recursive: true });

  const builtByEntry = new Map<string, BuiltPage>();
  const failures: string[] = [];
  for (const entry of entries) {
    const styles = prepared.get(entry);
    if (!styles) throw new Error(`Missing static style discovery: ${entry}`);
    const built = await buildPage(config, entry, styles);
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
    const documentStyles = await externalizeDocumentStyles(html);
    const cssPaths = await writeStaticStyleAssets(pageHtmlPath, [
      ...page.staticStyles,
      ...documentStyles.assets,
    ]);
    await writeFile(pageHtmlPath, documentStyles.html);
    assetsBuilt.push(...page.assets, ...cssPaths, pageHtmlPath);
  }

  return {
    root: config.root,
    outDir: config.build.outDir,
    assetsBuilt: [...new Set(assetsBuilt)],
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
  entry: string,
  prepared: PreparedStyles
): Promise<BuiltPage | string> {
  let result: Awaited<ReturnType<typeof Bun.build>>;
  let groups = (await sourcesUnchanged(prepared.discovery))
    ? prepared.groups
    : [];
  let changed = false;
  const plugin: Bun.BunPlugin = {
    name: 'tsone-static-styles',
    setup(builder) {
      builder.onLoad(
        { filter: /\.[cm]?[jt]sx?$/, namespace: 'file' },
        async (args) => {
          const module = prepared.discovery.modules.get(resolve(args.path));
          if (!module) {
            changed = true;
            return;
          }
          const source = await readFile(args.path, 'utf8');
          if (source !== module.source) {
            changed = true;
            return { contents: source, loader: module.loader };
          }
          const candidates = groups.filter(
            (group) => group.modulePath === module.path
          );
          return {
            contents: transformStaticStyles(
              source,
              candidates,
              (css) => `./${makeStaticStyleAsset(css).filename}`
            ),
            loader: module.loader,
          };
        }
      );
    },
  };
  try {
    result = await Bun.build({
      ...pageBuildOptions(config, entry),
      plugins: groups.length ? [plugin] : undefined,
    });
    if (changed) {
      groups = [];
      const beforeRetry = new Map<string, string>();
      for (const module of prepared.discovery.modules.values())
        beforeRetry.set(module.path, await readFile(module.path, 'utf8'));
      result = await Bun.build(pageBuildOptions(config, entry));
      for (const [path, source] of beforeRetry) {
        if ((await readFile(path, 'utf8')) !== source)
          throw new Error('Sources kept changing during static CSS build');
      }
    }
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
    staticStyles: [
      ...new Map(
        groups.map((group) => {
          const asset = makeStaticStyleAsset(group.cssText);
          return [asset.filename, asset];
        })
      ).values(),
    ],
  };
}

function pageBuildOptions(
  config: Awaited<ReturnType<typeof resolveConfig>>,
  entry: string
): Bun.BuildConfig {
  return {
    entrypoints: [entry],
    outdir: config.build.outDir,
    target: 'browser',
    format: 'esm',
    minify: process.env.TSONE_MINIFY !== '0',
    naming: { entry: '[name].[ext]', chunk: '[name]-[hash].[ext]' },
    throw: false,
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
