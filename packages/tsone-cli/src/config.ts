import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type {
  BuildConfig,
  ProxyOptions,
  ResolveConfigOptions,
  ResolvedConfig,
  ServerConfig,
  UserConfig,
} from './types';

interface MergedConfig {
  entry: string;
  server: {
    host: string;
    port: number;
    proxy: Record<string, string | ProxyOptions>;
  };
  build: {
    outDir: string;
  };
}

type ConfigFileLoadResult =
  | { exists: false }
  | { exists: true; config: unknown };

const DEFAULT_CONFIG: MergedConfig = {
  entry: 'src/main.ts',
  server: {
    host: '127.0.0.1',
    port: 52211,
    proxy: {},
  },
  build: {
    outDir: 'dist',
  },
};

export function defineConfig(config: UserConfig): UserConfig {
  return config;
}

export async function resolveConfig(
  options: ResolveConfigOptions = {}
): Promise<ResolvedConfig> {
  const root = resolve(options.root ?? process.cwd());
  const configFile = resolve(root, 'tsone.config.ts');
  const hasInlineConfig = options.config !== undefined;
  const loadedConfig: ConfigFileLoadResult = hasInlineConfig
    ? { exists: false }
    : await loadConfigFile(configFile);
  let fileConfig: UserConfig = {};
  if (loadedConfig.exists) {
    const config = loadedConfig.config;
    validateUserConfig(config);
    fileConfig = config;
  }
  if (hasInlineConfig) {
    validateUserConfig(options.config);
  }
  const inlineOverrides = toInlineOverrides(options);
  validateUserConfig(inlineOverrides);
  const config = mergeConfig(fileConfig, options.config ?? {}, inlineOverrides);

  const entry = resolve(root, config.entry);
  if (!existsSync(entry)) {
    throw new Error(`Entry file does not exist: ${entry}`);
  }

  return {
    root,
    ...(loadedConfig.exists ? { configFile } : {}),
    entry,
    server: {
      host: config.server.host,
      port: config.server.port,
      proxy: config.server.proxy,
    },
    build: {
      outDir: resolve(root, config.build.outDir),
    },
  };
}

async function loadConfigFile(
  configFile: string
): Promise<ConfigFileLoadResult> {
  if (!existsSync(configFile)) {
    return { exists: false };
  }

  const module = await import(
    `${pathToFileURL(configFile).href}?t=${Date.now()}`
  );
  return { exists: true, config: module.default };
}

function toInlineOverrides(options: ResolveConfigOptions): UserConfig {
  const server: ServerConfig = {};
  const build: BuildConfig = {};

  if (options.host !== undefined) {
    server.host = options.host;
  }
  if (options.port !== undefined) {
    server.port = options.port;
  }
  if (options.outDir !== undefined) {
    build.outDir = options.outDir;
  }

  return {
    ...(Object.keys(server).length > 0 ? { server } : {}),
    ...(Object.keys(build).length > 0 ? { build } : {}),
  };
}

function mergeConfig(...configs: UserConfig[]): MergedConfig {
  return configs.reduce<MergedConfig>((merged, config) => {
    const server = config.server;
    const build = config.build;

    return {
      entry: config.entry ?? merged.entry,
      server: {
        host: server?.host ?? merged.server.host,
        port: server?.port ?? merged.server.port,
        proxy: {
          ...merged.server.proxy,
          ...server?.proxy,
        },
      },
      build: {
        outDir: build?.outDir ?? merged.build.outDir,
      },
    };
  }, DEFAULT_CONFIG);
}

function validateUserConfig(config: unknown): asserts config is UserConfig {
  assertRecord(config, 'Config');

  if (config.entry !== undefined && typeof config.entry !== 'string') {
    throw new Error('Config entry must be a string');
  }
  if (config.server !== undefined) {
    validateServerConfig(config.server);
  }
  if (config.build !== undefined) {
    validateBuildConfig(config.build);
  }
}

function validateServerConfig(server: unknown): asserts server is ServerConfig {
  assertRecord(server, 'Config server');

  if (server.host !== undefined && typeof server.host !== 'string') {
    throw new Error('Config server.host must be a string');
  }
  const port = server.port;
  if (
    port !== undefined &&
    (typeof port !== 'number' ||
      !Number.isInteger(port) ||
      port < 0 ||
      port > 65535)
  ) {
    throw new Error(
      'Config server.port must be an integer between 0 and 65535'
    );
  }
  if (server.proxy === undefined) {
    return;
  }
  assertRecord(server.proxy, 'Config server.proxy');

  for (const [prefix, value] of Object.entries(server.proxy)) {
    if (!prefix.startsWith('/')) {
      throw new Error(`Proxy prefix must start with "/": ${prefix}`);
    }

    const target = getProxyTarget(value);
    validateProxyTarget(target);
  }
}

function validateBuildConfig(build: unknown): asserts build is BuildConfig {
  assertRecord(build, 'Config build');
  if (build.outDir !== undefined && typeof build.outDir !== 'string') {
    throw new Error('Config build.outDir must be a string');
  }
}

function getProxyTarget(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  assertRecord(value, 'Proxy options');
  if (typeof value.target !== 'string') {
    throw new Error('Proxy target must be a string');
  }
  if (
    value.changeOrigin !== undefined &&
    typeof value.changeOrigin !== 'boolean'
  ) {
    throw new Error('Proxy changeOrigin must be a boolean');
  }
  if (value.rewrite !== undefined && typeof value.rewrite !== 'function') {
    throw new Error('Proxy rewrite must be a function');
  }

  return value.target;
}

function validateProxyTarget(target: string): void {
  try {
    const url = new URL(target);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return;
    }
  } catch {
    // Keep the public error stable for malformed URLs and unsupported protocols.
  }

  throw new Error(`Proxy target must use http or https: ${target}`);
}

function assertRecord(
  value: unknown,
  name: string
): asserts value is Record<string, unknown> {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    (Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null)
  ) {
    throw new Error(`${name} must be an object`);
  }
}
