import { afterEach, describe, expect, it } from 'bun:test';
import { repoPath } from './paths';

let devProcess: ReturnType<typeof Bun.spawn> | undefined;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1000);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function waitForServer(url: string): Promise<Response> {
  const deadline = Date.now() + 10000;

  while (Date.now() < deadline) {
    if (devProcess?.exitCode !== null) {
      const stderr = devProcess.stderr
        ? await new Response(devProcess.stderr).text()
        : '';
      throw new Error(`dev server exited early: ${stderr.trim()}`);
    }

    try {
      const response = await fetchWithTimeout(url);
      if (response.ok) {
        return response;
      }
    } catch {
      // The process may need a moment to bind the port.
    }

    await Bun.sleep(50);
  }

  throw new Error(`dev server did not respond at ${url}`);
}

async function waitForDevServerUrl(): Promise<string> {
  const stdout = devProcess?.stdout;
  if (!stdout) {
    throw new Error('dev server stdout is not available');
  }

  const reader = stdout.getReader();
  const decoder = new TextDecoder();
  let output = '';
  const deadline = Date.now() + 10000;

  try {
    while (Date.now() < deadline) {
      const remaining = deadline - Date.now();
      const result = await Promise.race([
        reader.read(),
        Bun.sleep(remaining).then(() => undefined),
      ]);
      if (!result) {
        break;
      }

      output += decoder.decode(result.value, { stream: !result.done });
      const match = output.match(
        /TSone dev server listening at (http:\/\/[^\s]+)/
      );
      if (match?.[1]) {
        return match[1];
      }
      if (result.done) {
        break;
      }
    }
  } finally {
    reader.releaseLock();
  }

  const stderr = devProcess?.stderr
    ? await new Response(devProcess.stderr).text()
    : '';
  throw new Error(
    `dev server did not report its URL: ${output}${stderr}`.trim()
  );
}

async function stopDevProcess(): Promise<void> {
  const process = devProcess;
  devProcess = undefined;

  if (!process || process.exitCode !== null) {
    return;
  }

  process.kill();
  const exited = await Promise.race([
    process.exited.then(() => true),
    Bun.sleep(2000).then(() => false),
  ]);
  if (!exited && process.exitCode === null) {
    process.kill('SIGKILL');
    await process.exited;
  }
}

afterEach(async () => {
  await stopDevProcess();
});

describe('TSone CLI playground dev server', () => {
  it('serves every playground through its workspace CLI dependency', async () => {
    const projects = [
      {
        name: 'official-site',
        title: 'TSone Playground 官网',
        bundleText: '纯 TypeScript 前端框架',
      },
      {
        name: 'admin-dashboard',
        title: 'TSone Playground 后台',
        bundleText: 'TSone 控制台',
      },
    ];

    for (const project of projects) {
      devProcess = Bun.spawn({
        cmd: [
          'bun',
          'run',
          'tsone',
          'dev',
          '--host',
          '127.0.0.1',
          '--port',
          '0',
        ],
        cwd: repoPath('playground', project.name),
        env: {
          ...process.env,
          BUN_INSTALL_CACHE_DIR:
            process.env.BUN_INSTALL_CACHE_DIR ?? '/private/tmp/tsone-bun-cache',
          TMPDIR: process.env.TMPDIR ?? '/private/tmp/tsone-bun-tmp',
        },
        stdout: 'pipe',
        stderr: 'pipe',
      });

      try {
        const baseUrl = await waitForDevServerUrl();
        const html = await waitForServer(`${baseUrl}/`);
        expect(html.status).toBe(200);
        expect(html.headers.get('content-type')).toContain('text/html');

        const text = await html.text();
        expect(text).toContain(`<title>${project.title}</title>`);
        expect(text).toContain('<div id="app"></div>');
        expect(text).toContain(
          '<script type="module" src="/bundle.js"></script>'
        );

        const bundle = await fetchWithTimeout(`${baseUrl}/bundle.js`);
        expect(bundle.status).toBe(200);
        expect(bundle.headers.get('content-type')).toContain('text/javascript');
        expect(await bundle.text()).toContain(project.bundleText);
      } finally {
        await stopDevProcess();
      }
    }
  });
});
