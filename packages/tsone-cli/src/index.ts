export { defineConfig, resolveConfig } from './config';
export { build } from './build';
export { createProject } from './create';
export type { CreateProjectOptions, CreateProjectResult } from './create';
export { startDevServer, startMiniProgramDev } from './server';
export type { MiniProgramDevServer, StartDevServerOptions } from './server';
export type {
  BuildOptions,
  BuildResult,
  BuildConfig,
  LibraryConfig,
  ResolvedLibraryConfig,
  MiniProgramConfig,
  ResolvedMiniProgramConfig,
  ProxyOptions,
  ResolveConfigOptions,
  ResolvedConfig,
  ServerConfig,
  UserConfig,
} from './types';
