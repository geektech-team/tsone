#!/usr/bin/env bun
/**
 * TSone monorepo 外层发布脚本。
 *
 * 在仓库根目录使用：
 *   bun run release --package <tsone|one|tsone-cli> [操作]...
 *
 * 操作（可组合，至少指定一个；执行顺序固定为 bump → build → publish）：
 *   --build                   对目标包执行构建
 *   --bump <major|minor|patch> 升级主 / 功能 / 修复版本号，并同步该包内的
 *                              版本引用与相关契约测试
 *   --publish                 发布目标包到 npm（发布前若未构建会自动先构建）
 *   --dry-run                 只打印将要执行的步骤，不写入任何文件、不发布
 *
 * 示例：
 *   bun run release --package tsone --bump minor            # 升版本 + 构建 + 发布
 *   bun run release --package one --bump patch --no...      # 见 --dry-run
 *   bun run release --package tsone-cli --build             # 仅构建
 *   bun run release --package tsone --bump major --dry-run  # 演练，不落盘
 *
 * 说明：
 *   - 版本升级时会同步该包已知的硬编码版本引用；升级 tsone 时还会同步
 *     one 的 peerDependencies 范围与相关契约测试，保证 monorepo 一致性。
 *   - 发布使用 Bun 原生的 `bun publish`，需要已登录 npm（bun pm whoami）。
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dir, '..');

const PACKAGES: Record<string, { dir: string; name: string }> = {
  tsone: { dir: 'packages/tsone', name: '@geektech/tsone' },
  one: { dir: 'packages/one', name: '@geektech/one' },
  'tsone-cli': { dir: 'packages/tsone-cli', name: '@geektech/tsone-cli' },
};

const BUMP_TYPES = ['major', 'minor', 'patch'] as const;
type BumpType = (typeof BUMP_TYPES)[number];

interface CliArgs {
  pkg: string | null;
  build: boolean;
  publish: boolean;
  bump: BumpType | null;
  dryRun: boolean;
}

function printHelp(): void {
  console.log(
    [
      '用法：bun run release --package <tsone|one|tsone-cli> [操作]...',
      '',
      '操作（至少一个，执行顺序：bump → build → publish）：',
      '  --build                   构建目标包',
      '  --bump <major|minor|patch> 升级主 / 功能 / 修复版本号并同步版本引用',
      '  --publish                 发布目标包到 npm',
      '  --dry-run                 演练模式：不写入文件、不发布',
      '',
      '示例：',
      '  bun run release --package tsone --bump minor',
      '  bun run release --package one --bump patch --build --publish',
      '  bun run release --package tsone-cli --build',
    ].join('\n')
  );
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    pkg: null,
    build: false,
    publish: false,
    bump: null,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--package':
      case '--pkg': {
        const value = argv[++i];
        if (value === undefined) {
          fail(`参数 ${arg} 需要包名`);
        }
        args.pkg = normalizePackage(value);
        if (!args.pkg) {
          fail(`未知包：${value}（可选 tsone | one | tsone-cli）`);
        }
        break;
      }
      case '--build':
        args.build = true;
        break;
      case '--publish':
        args.publish = true;
        break;
      case '--bump': {
        const value = argv[++i];
        if (!value || !(BUMP_TYPES as readonly string[]).includes(value)) {
          fail(`--bump 需要 major | minor | patch，收到：${value}`);
        }
        args.bump = value as BumpType;
        break;
      }
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      default:
        fail(`未知参数：${arg}`);
    }
  }
  return args;
}

function fail(message: string): never {
  console.error(`错误：${message}`);
  console.error('');
  printHelp();
  process.exit(1);
}

function normalizePackage(raw: string): string | null {
  const key = raw.trim().toLowerCase().replace(/^@geektech\//, '');
  return key in PACKAGES ? key : null;
}

function readManifest(dir: string): { version: string } {
  const path = join(REPO_ROOT, dir, 'package.json');
  return JSON.parse(readFileSync(path, 'utf8')) as { version: string };
}

function bumpVersion(version: string, type: BumpType): string {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    fail(`无法解析语义化版本号：${version}`);
  }
  const [major, minor, patch] = [Number(match[1]), Number(match[2]), Number(match[3])];
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
  }
}

function runBun(args: string[], cwd: string): void {
  const result = spawnSync('bun', args, { cwd, stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

interface SyncTarget {
  file: string;
  from: string;
  to: string;
}

function syncFile(target: SyncTarget, dryRun: boolean): void {
  const abs = join(REPO_ROOT, target.file);
  if (!existsSync(abs)) {
    fail(`同步失败：文件不存在 ${target.file}`);
  }
  const content = readFileSync(abs, 'utf8');
  if (!content.includes(target.from)) {
    fail(`同步失败：${target.file} 中未找到「${target.from}」`);
  }
  if (dryRun) {
    console.log(`  [dry-run] ${target.file}`);
    console.log(`      ${target.from} -> ${target.to}`);
    return;
  }
  writeFileSync(abs, content.split(target.from).join(target.to));
  console.log(`  已更新 ${target.file}`);
  console.log(`      ${target.from} -> ${target.to}`);
}

/** one 对 tsone 的 peer 范围约定：>=当前版本 <(主.次+1).0 */
function peerRange(version: string): { low: string; high: string } {
  const [major, minor] = version.split('.').map(Number);
  return { low: version, high: `${major}.${minor + 1}.0` };
}

function syncForBump(pkgKey: string, oldVersion: string, newVersion: string, dryRun: boolean): void {
  const targets: SyncTarget[] = [];

  if (pkgKey === 'tsone') {
    targets.push(
      { file: 'packages/tsone/package.json', from: `"version": "${oldVersion}"`, to: `"version": "${newVersion}"` },
      { file: 'packages/tsone/lib/index.ts', from: `version = '${oldVersion}'`, to: `version = '${newVersion}'` },
      { file: 'packages/tsone/lib/core/app.ts', from: `version: '${oldVersion}',`, to: `version: '${newVersion}',` },
      { file: 'packages/tsone/lib/dom/index.ts', from: `userAgent = 'TSone/${oldVersion}'`, to: `userAgent = 'TSone/${newVersion}'` },
      { file: 'packages/tsone/README.md', from: `version: '${oldVersion}',`, to: `version: '${newVersion}',` },
      { file: 'packages/tsone/README.md', from: '`version`, currently `' + oldVersion + '`', to: '`version`, currently `' + newVersion + '`' },
      { file: 'packages/tsone/README-zh.md', from: `version: '${oldVersion}',`, to: `version: '${newVersion}',` },
      { file: 'packages/tsone/README-zh.md', from: '`version`，当前为 `' + oldVersion + '`', to: '`version`，当前为 `' + newVersion + '`' },
      // tsone-cli 契约测试中引用 tsone 版本的两处
      { file: 'packages/tsone-cli/tests/package-smoke.test.ts', from: `'@geektech/tsone': '${oldVersion}',`, to: `'@geektech/tsone': '${newVersion}',` },
      { file: 'packages/tsone-cli/tests/package-smoke.test.ts', from: `installedFrameworkManifest.version).toBe('${oldVersion}')`, to: `installedFrameworkManifest.version).toBe('${newVersion}')` }
    );
    // one 对 tsone 的 peerDependencies 范围随 tsone 版本同步
    const oldRange = peerRange(oldVersion);
    const newRange = peerRange(newVersion);
    targets.push(
      { file: 'packages/one/package.json', from: `"@geektech/tsone": ">=${oldRange.low} <${oldRange.high}"`, to: `"@geektech/tsone": ">=${newRange.low} <${newRange.high}"` },
      { file: 'packages/one/tests/package-contract.test.ts', from: `peerDependencies['@geektech/tsone']).toBe('>=${oldRange.low} <${oldRange.high}')`, to: `peerDependencies['@geektech/tsone']).toBe('>=${newRange.low} <${newRange.high}')` }
    );
  } else if (pkgKey === 'one') {
    targets.push(
      { file: 'packages/one/package.json', from: `"version": "${oldVersion}"`, to: `"version": "${newVersion}"` },
      { file: 'packages/one/lib/index.ts', from: `ONE_VERSION = '${oldVersion}'`, to: `ONE_VERSION = '${newVersion}'` },
      { file: 'packages/one/tests/package-contract.test.ts', from: `manifest.version).toBe('${oldVersion}')`, to: `manifest.version).toBe('${newVersion}')` },
      { file: 'packages/one/tests/package-smoke.test.ts', from: `geektech-one-${oldVersion}.tgz`, to: `geektech-one-${newVersion}.tgz` },
      { file: 'packages/one/tests/package-smoke.test.ts', from: `packageVersion: '${oldVersion}' = ONE_VERSION`, to: `packageVersion: '${newVersion}' = ONE_VERSION` },
      { file: 'packages/one/tests/package-smoke.test.ts', from: `version: '${oldVersion}',`, to: `version: '${newVersion}',` }
    );
  } else if (pkgKey === 'tsone-cli') {
    targets.push(
      { file: 'packages/tsone-cli/package.json', from: `"version": "${oldVersion}"`, to: `"version": "${newVersion}"` },
      { file: 'packages/tsone-cli/tests/package-smoke.test.ts', from: `installedCliManifest.version).toBe('${oldVersion}')`, to: `installedCliManifest.version).toBe('${newVersion}')` }
    );
  }

  for (const target of targets) {
    syncFile(target, dryRun);
  }
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  if (!args.pkg) {
    fail('请用 --package 指定目标包（tsone | one | tsone-cli）');
  }
  if (!args.build && !args.bump && !args.publish) {
    fail('请至少指定一个操作：--build / --bump <major|minor|patch> / --publish');
  }

  const pkg = PACKAGES[args.pkg];
  const version = readManifest(pkg.dir).version;
  console.log(`目标包：${pkg.name}（${pkg.dir}）  当前版本：${version}`);
  if (args.dryRun) {
    console.log('[演练模式 --dry-run，不会写入或发布]');
  }

  if (args.bump) {
    const newVersion = bumpVersion(version, args.bump);
    console.log(`\n== 1/3 升级版本号：${version} -> ${newVersion}（${args.bump}）==`);
    syncForBump(args.pkg, version, newVersion, args.dryRun);
    if (args.dryRun) {
      console.log('  [dry-run] 运行 bun install 同步 lockfile');
    } else {
      console.log('  运行 bun install 同步 lockfile…');
      runBun(['install'], REPO_ROOT);
      console.log('  版本升级完成。');
    }
  }

  if (args.build) {
    console.log(`\n== 2/3 构建 ${pkg.name} ==`);
    if (args.dryRun) {
      console.log(`  [dry-run] bun run --cwd ${pkg.dir} build`);
    } else {
      runBun(['run', 'build'], join(REPO_ROOT, pkg.dir));
      console.log('  构建完成。');
    }
  }

  if (args.publish) {
    console.log(`\n== 3/3 发布 ${pkg.name} ==`);
    if (args.dryRun) {
      console.log(`  [dry-run] bun publish（cwd: ${pkg.dir}）`);
    } else {
      if (!args.build) {
        console.log('  未指定 --build，发布前自动执行构建…');
        runBun(['run', 'build'], join(REPO_ROOT, pkg.dir));
      }
      console.log('  执行 bun publish…（需要已登录 npm）');
      runBun(['publish'], join(REPO_ROOT, pkg.dir));
      console.log('  发布完成。');
    }
  }

  console.log('\n全部完成。');
}

main();
