import { afterEach, describe, expect, it } from 'bun:test';
import { repoPath } from './paths';

type DevProcess = ReturnType<typeof Bun.spawn>;

let devProcess: DevProcess | undefined;

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

async function waitForDevServerUrl(
  process: DevProcess,
  timeoutMs = 10000
): Promise<string> {
  const stdout = process.stdout;
  if (!stdout) {
    throw new Error('dev server stdout is not available');
  }

  const reader = stdout.getReader();
  const decoder = new TextDecoder();
  let output = '';
  const timedOut = Symbol('timed-out');
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<typeof timedOut>((resolve) => {
    timer = setTimeout(() => resolve(timedOut), timeoutMs);
  });

  try {
    for (;;) {
      const result = await Promise.race([reader.read(), timeout]);
      if (result === timedOut) {
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
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }

  const stderr =
    process.exitCode !== null && process.stderr
      ? await new Response(process.stderr).text()
      : '';
  const details = [output.trim(), stderr.trim()].filter(Boolean).join('\n');
  throw new Error(`dev server did not report its URL: ${details}`.trim());
}

async function waitForProcessExit(
  process: DevProcess,
  timeoutMs: number
): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      process.exited.then(() => true),
      new Promise<false>((resolve) => {
        timer = setTimeout(() => resolve(false), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

async function stopDevProcess(): Promise<void> {
  const process = devProcess;
  devProcess = undefined;

  if (!process || process.exitCode !== null) {
    return;
  }

  process.kill();
  const exited = await waitForProcessExit(process, 2000);
  if (!exited && process.exitCode === null) {
    process.kill('SIGKILL');
    if (!(await waitForProcessExit(process, 2000))) {
      throw new Error('dev server did not exit after SIGKILL');
    }
  }
}

afterEach(async () => {
  await stopDevProcess();
});

describe('TSone CLI playground dev server', () => {
  it('times out without waiting for stderr from a running process', async () => {
    devProcess = Bun.spawn({
      cmd: [
        'bun',
        '-e',
        "console.log('starting'); console.error('still running'); await Bun.sleep(60000);",
      ],
      stdout: 'pipe',
      stderr: 'pipe',
    });

    try {
      await expect(waitForDevServerUrl(devProcess, 200)).rejects.toThrow(
        'dev server did not report its URL: starting'
      );
    } finally {
      await stopDevProcess();
    }
  }, 2000);

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
        const baseUrl = await waitForDevServerUrl(devProcess);
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
  }, 45000);
});
