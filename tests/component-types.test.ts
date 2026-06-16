import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'bun:test';

const root = process.cwd();
const require = createRequire(import.meta.url);
const tscBin = require.resolve('typescript/bin/tsc');

function runTypeScriptProject(cwd: string): void {
  try {
    execFileSync(process.execPath, [tscBin, '--project', 'tsconfig.json'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const output = error as {
      stdout?: Buffer | string;
      stderr?: Buffer | string;
      message?: string;
    };
    throw new Error(
      [output.message, output.stdout?.toString(), output.stderr?.toString()]
        .filter(Boolean)
        .join('\n')
    );
  }
}

describe('component public types', () => {
  it('supports typed props and typed state on class components', () => {
    mkdirSync(tmpdir(), { recursive: true });
    const tempDir = mkdtempSync(join(tmpdir(), 'tsone-types-'));

    try {
      writeFileSync(
        join(tempDir, 'component-consumer.ts'),
        [
          "import { Component, EventListeners, HTMLProps, VNode } from 'tsone-source';",
          "import { RouteLocation, RouteMeta, createRouter } from 'tsone-source/router';",
          '',
          'interface Props {',
          '  label: string;',
          '}',
          '',
          'interface State {',
          '  count: number;',
          '  ready: boolean;',
          '}',
          '',
          'class TypedCounter extends Component<Props, State> {',
          '  protected initState(): State {',
          '    return { count: 0, ready: true };',
          '  }',
          '',
          '  protected initStyles(): void {}',
          '',
          '  protected render(): VNode {',
          '    const label: string = this.props.label;',
          '    const count: number = this.state.count;',
          '    const ready: boolean = this.state.ready;',
          '    this.setState({ count: count + 1 });',
          "    return { tag: 'button', children: [`${label}:${count}:${ready}`] };",
          '  }',
          '}',
          '',
          "const counter = new TypedCounter({ label: 'Count' });",
          'counter.setState({ ready: false });',
          '',
          'const htmlProps: HTMLProps = {',
          "  className: 'counter',",
          '  disabled: false,',
          "  style: { opacity: 0.9, color: 'red' },",
          "  'aria-label': 'Typed counter'",
          '};',
          '',
          'const listeners: EventListeners = {',
          '  click: (event: Event) => {',
          '    event.preventDefault();',
          '  }',
          '};',
          '',
          "const routeMeta: RouteMeta = { title: 'Home', requiresAuth: true };",
          "const router = createRouter({ routes: [{ path: '/', component: TypedCounter, meta: routeMeta }] });",
          'const route: RouteLocation | null = router.getCurrentRoute();',
          'const title: unknown = route?.meta?.title;',
          '',
          'void htmlProps;',
          'void listeners;',
          'void title;',
        ].join('\n')
      );
      writeFileSync(
        join(tempDir, 'tsconfig.json'),
        JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2020',
              module: 'ESNext',
              moduleResolution: 'Bundler',
              lib: ['ES2020', 'DOM'],
              strict: true,
              skipLibCheck: false,
              noEmit: true,
              baseUrl: '.',
              paths: {
                'tsone-source': [join(root, 'lib/index.ts')],
                'tsone-source/router': [join(root, 'lib/router/index.ts')],
              },
            },
            include: ['component-consumer.ts'],
          },
          null,
          2
        )
      );

      runTypeScriptProject(tempDir);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
