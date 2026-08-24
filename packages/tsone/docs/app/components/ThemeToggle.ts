import { Component, type VNode } from '../../../lib';

type ThemeMode = 'light' | 'dark';

interface ThemeToggleState {
  mode: ThemeMode;
}

export class ThemeToggle extends Component<object, ThemeToggleState> {
  protected initState(): ThemeToggleState {
    return { mode: readTheme() };
  }

  protected initStyles(): void {}

  protected onMounted(): void {
    applyTheme(this.state.mode);
  }

  protected render(): VNode {
    return {
      tag: 'button',
      props: {
        type: 'button',
        className: 'docs-theme-toggle',
        'aria-label': '切换文档主题',
      },
      listeners: {
        click: () => {
          this.state.mode = this.state.mode === 'dark' ? 'light' : 'dark';
          localStorage.setItem('tsone-docs-theme', this.state.mode);
          applyTheme(this.state.mode);
        },
      },
      children: [this.state.mode === 'dark' ? '浅色' : '深色'],
    };
  }
}

function readTheme(): ThemeMode {
  const stored = localStorage.getItem('tsone-docs-theme');
  return stored === 'dark' ? 'dark' : 'light';
}

function applyTheme(mode: ThemeMode): void {
  document.documentElement.dataset.theme = mode;
}
