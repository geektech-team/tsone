import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'bun:test';
import { resetRouter } from '../lib/router/instance';

describe('example entry', () => {
  beforeEach(() => {
    resetRouter();
    document.body.innerHTML = '<div id="app"></div>';
    window.history.replaceState({}, '', '/');
  });

  it('renders meaningful app content on startup', async () => {
    await import(`../examples/index.ts?run=${Date.now()}`);

    const app = document.querySelector('#app');

    expect(app?.textContent).toContain('TSone 示例');
    expect(app?.textContent).toContain('首页');
  });

  it('uses element shortcut helpers for supported tags in example components', () => {
    const exampleComponents = [
      'examples/components/Home.ts',
      'examples/components/Counter.ts',
      'examples/components/SlotDemo.ts',
      'examples/components/Card.ts',
      'examples/components/TextInput.ts',
      'examples/components/Navigation.ts',
    ];

    const rawSupportedTags = exampleComponents.flatMap((file) => {
      const text = readFileSync(join(process.cwd(), file), 'utf8');
      const matches = text.matchAll(
        /tag:\s*['"](div|span|p|button|input)['"]/g
      );

      return [...matches].map((match) => `${file}: ${match[0]}`);
    });

    expect(rawSupportedTags).toEqual([]);
  });
});
