import { randomUUID } from 'node:crypto';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { isEntryJavaScriptOutput, isStylesheetOutput } from './build-output';
import { resolveConfig } from './config';
import { renderProjectHtml } from './project';
import { createProxyHandler } from './proxy';
import type { ResolveConfigOptions, ResolvedConfig } from './types';

const DEVELOPMENT_URL_PREFIX = '/dev';

export type StartDevServerOptions = ResolveConfigOptions;

export async function startDevServer(
  options: StartDevServerOptions = {}
): Promise<ReturnType<typeof Bun.serve>> {
  const config = await resolveConfig(options);
  await renderProjectHtml(config, {});
  const proxy = createProxyHandler(config.server.proxy);
  const sessionId = createGenerationId();
  const sessionOutDir = resolve(config.root, '.tsone', 'dev', sessionId);
  const artifacts = new Map<string, DevelopmentOutput>();
  const buildProject = createDevelopmentBuilder(
    config,
    sessionId,
    sessionOutDir,
    artifacts
  );

  return Bun.serve({
    hostname: config.server.host,
    port: config.server.port,
    fetch: async (request) =>
      (await proxy(request)) ??
      serveProjectRequest(request, config, buildProject, artifacts),
  });
}

async function serveProjectRequest(
  request: Request,
  config: ResolvedConfig,
  buildProject: () => Promise<DevelopmentBundle | Response>,
  artifacts: ReadonlyMap<string, DevelopmentOutput>
): Promise<Response> {
  const pathname = new URL(request.url).pathname;

  if (pathname === '/' || pathname === '/index.html') {
    const bundle = await buildProject();
    if (bundle instanceof Response) {
      return bundle;
    }

    const html = await renderProjectHtml(config, {
      head: bundle.stylesheets.map(({ pathname: href }) => ({
        tag: 'link',
        attributes: { rel: 'stylesheet', href },
      })),
      scripts: [{ type: 'module', src: bundle.entry.pathname }],
    });
    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  }

  if (pathname === '/bundle.js') {
    const bundle = await buildProject();
    if (bundle instanceof Response) {
      return bundle;
    }

    return new Response(null, {
      status: 307,
      headers: {
        location: bundle.entry.pathname,
        'cache-control': 'no-store',
      },
    });
  }

  const artifact = artifacts.get(pathname);
  if (artifact) {
    return new Response(Bun.file(artifact.filePath), {
      headers: {
        'content-type': artifact.type,
        'cache-control': 'no-store',
      },
    });
  }

  return new Response('Not found', {
    status: 404,
    headers: { 'cache-control': 'no-store' },
  });
}

interface DevelopmentOutput {
  filePath: string;
  pathname: string;
  type: string;
}

interface DevelopmentBundle {
  entry: DevelopmentOutput;
  stylesheets: DevelopmentOutput[];
}

function createDevelopmentBuilder(
  config: ResolvedConfig,
  sessionId: string,
  sessionOutDir: string,
  artifacts: Map<string, DevelopmentOutput>
): () => Promise<DevelopmentBundle | Response> {
  let queue = Promise.resolve();

  return () => {
    const result = queue.then(() =>
      buildProjectBundle(config, sessionId, sessionOutDir, artifacts)
    );
    queue = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  };
}

async function buildProjectBundle(
  config: ResolvedConfig,
  sessionId: string,
  sessionOutDir: string,
  artifacts: Map<string, DevelopmentOutput>
): Promise<DevelopmentBundle | Response> {
  const generationId = createGenerationId();
  const generationOutDir = resolve(sessionOutDir, generationId);
  const buildOptions = {
    entrypoints: [config.entry],
    outdir: generationOutDir,
    target: 'browser' as const,
    format: 'esm' as const,
    sourcemap: 'inline' as const,
    write: true,
    throw: false,
    naming: {
      entry: '[name]-[hash].[ext]',
      chunk: '[name]-[hash].[ext]',
      asset: 'assets/[name]-[hash].[ext]',
    },
  };

  try {
    const result = await Bun.build(buildOptions);
    const entryArtifact = result.outputs.find(isEntryJavaScriptOutput);
    if (!result.success || !entryArtifact) {
      result.logs.forEach((log) => console.error(log));
      if (!entryArtifact) {
        console.error('Failed to build project bundle: no JavaScript output');
      }
      return buildFailureResponse();
    }

    const generationUrl = `${DEVELOPMENT_URL_PREFIX}/${sessionId}/${generationId}`;
    const pendingArtifacts = new Map<string, DevelopmentOutput>();
    const outputs = new Map<
      Awaited<ReturnType<typeof Bun.build>>['outputs'][number],
      DevelopmentOutput
    >();

    for (const output of result.outputs) {
      const developmentOutput = createDevelopmentOutput(
        generationOutDir,
        generationUrl,
        output
      );
      if (
        pendingArtifacts.has(developmentOutput.pathname) ||
        artifacts.has(developmentOutput.pathname)
      ) {
        throw new Error(
          `Development output URL collision: ${developmentOutput.pathname}`
        );
      }
      pendingArtifacts.set(developmentOutput.pathname, developmentOutput);
      outputs.set(output, developmentOutput);
    }

    const entry = outputs.get(entryArtifact);
    if (!entry) {
      throw new Error('Development entry output was not indexed');
    }

    for (const [pathname, output] of pendingArtifacts) {
      artifacts.set(pathname, output);
    }

    return {
      entry,
      stylesheets: result.outputs
        .filter(isStylesheetOutput)
        .map((output) => outputs.get(output))
        .filter((output): output is DevelopmentOutput => output !== undefined),
    };
  } catch (error: unknown) {
    console.error(error);
    return buildFailureResponse();
  }
}

function createDevelopmentOutput(
  generationOutDir: string,
  generationUrl: string,
  output: Awaited<ReturnType<typeof Bun.build>>['outputs'][number]
): DevelopmentOutput {
  const filePath = resolve(output.path);
  const pathFromGeneration = relative(generationOutDir, filePath);
  if (
    pathFromGeneration === '' ||
    pathFromGeneration === '..' ||
    pathFromGeneration.startsWith(`..${sep}`) ||
    isAbsolute(pathFromGeneration)
  ) {
    throw new Error(
      `Development output must not escape outside its generation directory: ${output.path}`
    );
  }

  const urlPath = pathFromGeneration
    .split(sep)
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return {
    filePath,
    pathname: `${generationUrl}/${urlPath}`,
    type: output.type,
  };
}

function createGenerationId(): string {
  return randomUUID().replace(/-/g, '');
}

function buildFailureResponse(): Response {
  return new Response('Failed to build project bundle', {
    status: 500,
    headers: { 'cache-control': 'no-store' },
  });
}
