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
}

export interface UserConfig {
  entry?: string;
  pages?: Record<string, string>;
  server?: ServerConfig;
  build?: BuildConfig;
}

export interface ResolveConfigOptions {
  root?: string;
  config?: UserConfig;
  host?: string;
  port?: number;
  outDir?: string;
}

export interface BuildOptions extends ResolveConfigOptions {}

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
  };
}
