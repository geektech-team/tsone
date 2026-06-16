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
});
