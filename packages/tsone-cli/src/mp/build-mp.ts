import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import type { ResolvedConfig, BuildResult } from '../types';
import { loadTypescript } from './ts-loader';
import { CompileContext, CompiledUnit } from './types';
import { findRootClass } from './analyze';
import { compileUnit, finalizeComponentProperties } from './compile';
import { generatePageJs, generateComponentJs } from './jsgen';

const GENERATED_COMMENT = '由 tsone build --mp-weixin 生成，请勿手动编辑';

/**
 * 把 TSone 应用编译为微信小程序工程：
 * app.json / app.js / app.wxss / project.config.json / sitemap.json
 * + pages/<route>/<name>.* + components/<tag>/<tag>.*
 */
export async function buildMiniProgram(
  config: ResolvedConfig
): Promise<BuildResult> {
  const mp = config.mp;
  if (!mp) {
    throw new Error('Mini program build requires config.mp');
  }

  const ts = await loadTypescript();
  const context: CompileContext = {
    ts,
    root: config.root,
    files: new Map(),
    components: new Map(),
    compiling: new Set(),
    callSites: new Map(),
    lengthUnit: mp.lengthUnit,
    warnings: [],
  };

  const pages: Array<{ route: string; unit: CompiledUnit }> = [];
  for (const [route, entry] of Object.entries(mp.pages)) {
    const rootClass = findRootClass(context, entry);
    const location = pageLocation(route);
    const unit = compileUnit(context, rootClass, {
      kind: 'page',
      name: location.name,
    });
    pages.push({ route, unit });
  }
  finalizeComponentProperties(context);
  for (const warning of context.warnings) {
    console.warn(`[tsone mp] ${warning}`);
  }

  const outDir = mp.outDir;
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const assetsBuilt: string[] = [];
  const write = async (path: string, content: string): Promise<void> => {
    const target = join(outDir, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content, 'utf8');
    assetsBuilt.push(target);
  };

  // —— 应用级文件 ——
  await write(
    'project.config.json',
    `${JSON.stringify(
      {
        appid: mp.appId,
        projectname: basename(config.root),
        compileType: 'miniprogram',
        setting: {
          es6: true,
          postcss: true,
          minified: true,
          urlCheck: false,
        },
      },
      null,
      2
    )}\n`
  );

  await write(
    'app.json',
    `${JSON.stringify(
      {
        pages: pages.map(({ route }) => appPagePath(route)),
        window: {
          navigationBarTitleText: mp.navigationBarTitleText,
          navigationBarBackgroundColor: '#ffffff',
          navigationBarTextStyle: 'black',
          backgroundTextStyle: 'light',
          ...mp.window,
        },
        ...(mp.tabBar !== undefined ? { tabBar: mp.tabBar } : {}),
        ...mp.appExtra,
        style: 'v2',
        sitemapLocation: 'sitemap.json',
      },
      null,
      2
    )}\n`
  );

  await write(
    'app.js',
    `App(${JSON.stringify(
      mp.globalData !== undefined ? { globalData: mp.globalData } : {}
    )});\n`
  );
  await write(
    'sitemap.json',
    `${JSON.stringify(
      {
        desc: GENERATED_COMMENT,
        rules: [{ action: 'allow', page: '*' }],
      },
      null,
      2
    )}\n`
  );

  const globalStyles = new Set<string>();
  for (const { unit } of pages) {
    if (unit.globalStyle) {
      globalStyles.add(unit.globalStyle);
    }
  }
  await write('app.wxss', `${[...globalStyles].join('\n')}\n`);

  // —— 页面 ——
  for (const { route, unit } of pages) {
    const base = pageFileBase(route);
    await write(`pages/${base}.wxml`, unit.template);
    await write(`pages/${base}.wxss`, `${unit.style}\n`);
    await write(`pages/${base}.js`, generatePageJs(unit));
    await write(
      `pages/${base}.json`,
      `${JSON.stringify(
        {
          usingComponents: unit.usingComponents,
          ...mp.pageExtra?.[route],
        },
        null,
        2
      )}\n`
    );
  }

  // —— 自定义组件 ——
  for (const [tag, unit] of context.components) {
    await write(`components/${tag}/${tag}.wxml`, unit.template);
    await write(`components/${tag}/${tag}.wxss`, `${unit.style}\n`);
    await write(`components/${tag}/${tag}.js`, generateComponentJs(unit));
    await write(
      `components/${tag}/${tag}.json`,
      `${JSON.stringify(
        {
          component: true,
          multipleSlots: true,
          usingComponents: unit.usingComponents,
        },
        null,
        2
      )}\n`
    );
  }

  // —— 静态资源目录（public/ 默认；不存在则跳过）——
  // 上面生成文件已写完，public 仅补产物中不存在的内容：避免覆盖生成文件。
  if (existsSync(mp.publicDir)) {
    for (const file of await listFiles(mp.publicDir)) {
      const target = join(outDir, file);
      if (!existsSync(target)) {
        await cp(join(mp.publicDir, file), target, {
          recursive: true,
          force: true,
          errorOnExist: false,
        });
      }
    }
  }

  return {
    root: config.root,
    outDir: resolve(outDir),
    assetsBuilt,
  };
}

function pageLocation(route: string): { directory: string; name: string } {
  const segments = route.replace(/^\/+/, '').split('/').filter(Boolean);
  if (segments.length === 0) {
    return { directory: '', name: 'index' };
  }
  const name = segments[segments.length - 1];
  const directory = segments.slice(0, -1).join('/');
  return { directory, name };
}

/** 页面文件基名：route '/' -> 'index/index'；'/about' -> 'about/about'。 */
function pageFileBase(route: string): string {
  const location = pageLocation(route);
  const directory =
    location.directory === ''
      ? location.name
      : `${location.directory}/${location.name}`;
  return `${directory}/${location.name}`;
}

function appPagePath(route: string): string {
  return `pages/${pageFileBase(route)}`;
}

/** 递归列出目录下所有文件（相对根目录的路径）。 */
async function listFiles(root: string, dir: string = root): Promise<string[]> {
  const out: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await listFiles(root, abs)));
    } else {
      out.push(relative(root, abs));
    }
  }
  return out;
}
