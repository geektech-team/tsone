import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  discoverModules,
  RuntimeModuleGraph,
  sourcesUnchanged,
  type Discovery,
} from './module-graph';
import {
  analyzeFixedStyles,
  transformStaticStyles,
  type FixedStyleGroup,
} from './analyze';
import {
  canExternalizeCss,
  makeStaticStyleAsset,
  type StaticStyleAsset,
} from './assets';

export interface PreparedStyles {
  discovery: Discovery;
  groups: FixedStyleGroup[];
}

export async function prepareStaticStyles(
  options: Bun.BuildConfig
): Promise<PreparedStyles> {
  const discovery = await discoverModules(options);
  const groups = analyzeFixedStyles(new RuntimeModuleGraph(discovery)).filter(
    (group) => canExternalizeCss(group.cssText)
  );
  return { discovery, groups };
}

export async function buildWithStaticStyles(
  options: Bun.BuildConfig,
  prepared: PreparedStyles,
  hrefForAsset: (asset: StaticStyleAsset) => string
): Promise<{
  result: Awaited<ReturnType<typeof Bun.build>>;
  staticStyles: StaticStyleAsset[];
}> {
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
          return {
            contents: transformStaticStyles(
              source,
              groups.filter((group) => group.modulePath === module.path),
              (css) => hrefForAsset(makeStaticStyleAsset(css))
            ),
            loader: module.loader,
          };
        }
      );
    },
  };
  let result = await Bun.build({
    ...options,
    plugins: groups.length
      ? [...(options.plugins ?? []), plugin]
      : options.plugins,
  });
  if (changed) {
    groups = [];
    const beforeRetry = new Map<string, string>();
    for (const module of prepared.discovery.modules.values())
      beforeRetry.set(module.path, await readFile(module.path, 'utf8'));
    result = await Bun.build(options);
    for (const [path, source] of beforeRetry) {
      if ((await readFile(path, 'utf8')) !== source)
        throw new Error('Sources kept changing during static CSS build');
    }
  }
  return {
    result,
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
