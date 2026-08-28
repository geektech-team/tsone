import { Component, type VNode } from '../../../lib';
import type { DocLocaleMessages } from '../content';

type ThemeMode = 'light' | 'dark';

interface ThemeToggleState {
  mode: ThemeMode;
}

export interface ThemeToggleProps {
  messages: DocLocaleMessages;
}

export class ThemeToggle extends Component<ThemeToggleProps, ThemeToggleState> {
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
        'aria-label': this.props.messages.themeToggleLabel,
      },
      listeners: {
        click: () => {
          this.state.mode = this.state.mode === 'dark' ? 'light' : 'dark';
          localStorage.setItem('tsone-docs-theme', this.state.mode);
          applyTheme(this.state.mode);
        },
      },
      children: [
        this.state.mode === 'dark'
          ? this.props.messages.lightThemeLabel
          : this.props.messages.darkThemeLabel,
      ],
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
