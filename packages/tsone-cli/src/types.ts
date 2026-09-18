export interface ProxyOptions {
  target: string;
  changeOrigin?: boolean;
  rewrite?: (path: string) => string;
}

export interface ServerConfig {
  host?: string;
  port?: number;
  proxy?: Record<string, string | ProxyOptions>;
}

export interface BuildConfig {
  outDir?: string;
  /** 部署基础路径（如 GitHub Pages 子路径），默认空字符串表示站点根路径。 */
  basePath?: string;
  /** 为每个页面输出为目录 + index.html（/{route}/index.html），默认输出扁平 {route}.html。 */
  directoryPages?: boolean;
}

/** 库打包配置：`tsone build --library` 时使用，产出可发布的 ESM bundle + .d.ts。 */
export interface LibraryConfig {
  /** 库入口（如 lib/index.ts），默认 src/index.ts。 */
  entry?: string;
  /** 库产物目录，默认 dist。 */
  outDir?: string;
  /** 作为外部依赖、不打进 bundle 的包名。 */
  external?: string[];
  /** 依次运行 `tsc --project <path>` 生成 .d.ts 的 tsconfig 列表，默认 ['tsconfig.build.json']。 */
  tsconfigs?: string[];
  /** 是否生成 .d.ts，默认 true。 */
  dts?: boolean;
  /** 是否开启代码分割，默认 true。 */
  splitting?: boolean;
  /** 是否生成 linked sourcemap，默认 true。 */
  sourcemap?: boolean;
  /** 是否压缩；默认由 TSONE_MINIFY 环境变量控制（未设置为 0 时压缩）。 */
  minify?: boolean;
}

export interface ResolvedLibraryConfig {
  entry: string;
  outDir: string;
  external: string[];
  tsconfigs: string[];
  dts: boolean;
  splitting: boolean;
  sourcemap: boolean;
  minify?: boolean;
}

export interface UserConfig {
  entry?: string;
  pages?: Record<string, string>;
  server?: ServerConfig;
  build?: BuildConfig;
  library?: LibraryConfig;
}

export interface ResolveConfigOptions {
  root?: string;
  config?: UserConfig;
  host?: string;
  port?: number;
  outDir?: string;
  /** 部署基础路径前缀（如 /tsone/one），覆盖 config.build.basePath。 */
  base?: string;
}

export interface BuildOptions extends ResolveConfigOptions {
  /** 构建 npm 库（读取 config.library）而不是站点。 */
  library?: boolean;
}

export interface BuildResult {
  root: string;
  outDir: string;
  assetsBuilt: string[];
}

export interface ResolvedConfig {
  root: string;
  configFile?: string;
  entry: string;
  pages: Record<string, string>;
  server: {
    host: string;
    port: number;
    proxy: Record<string, string | ProxyOptions>;
  };
  build: {
    outDir: string;
    basePath: string;
    directoryPages: boolean;
  };
  library?: ResolvedLibraryConfig;
}
