import { ONE_DEFAULT_THEME } from './default-theme';
import {
  OneThemeConfigError,
  OneThemeEnvironmentError,
  OneThemeNotFoundError,
} from './errors';
import { normalizeOneThemeOptions } from './normalize';
import type {
  OneResolvedTheme,
  OneThemeInitOptions,
  OneThemeService,
} from './types';
import { ONE_THEME_VARIABLES, oneThemeToVariables } from './variables';

type OneThemeRootResolver = () => HTMLElement | undefined;

interface OneThemeStyleSnapshot {
  readonly name: string;
  readonly value: string;
  readonly priority: string;
}

interface OneThemeDomSnapshot {
  readonly styles: readonly OneThemeStyleSnapshot[];
  readonly dataTheme: string | null;
}

const DEFAULT_REGISTRY: Readonly<Record<string, OneResolvedTheme>> =
  Object.freeze({ default: ONE_DEFAULT_THEME });

function assertSwitchName(name: unknown): asserts name is string {
  if (
    typeof name !== 'string' ||
    name.length === 0 ||
    name.trim() !== name ||
    /\s/.test(name)
  ) {
    throw new OneThemeConfigError(
      'Theme name must be a non-empty string without whitespace.'
    );
  }
}

function snapshotRoot(root: HTMLElement): OneThemeDomSnapshot {
  return {
    styles: ONE_THEME_VARIABLES.map(([name]) => ({
      name,
      value: root.style.getPropertyValue(name),
      priority: root.style.getPropertyPriority(name),
    })),
    dataTheme: root.getAttribute('data-one-theme'),
  };
}

function restoreRoot(root: HTMLElement, snapshot: OneThemeDomSnapshot): void {
  snapshot.styles.forEach(({ name, value, priority }) => {
    if (value.length === 0) {
      root.style.removeProperty(name);
      return;
    }
    root.style.setProperty(name, value, priority);
  });

  if (snapshot.dataTheme === null) {
    root.removeAttribute('data-one-theme');
  } else {
    root.setAttribute('data-one-theme', snapshot.dataTheme);
  }
}

function applyTheme(
  root: HTMLElement,
  name: string,
  theme: OneResolvedTheme
): void {
  const snapshot = snapshotRoot(root);
  try {
    oneThemeToVariables(theme).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    root.setAttribute('data-one-theme', name);
  } catch (error) {
    restoreRoot(root, snapshot);
    throw error;
  }
}

export class DomOneThemeService implements OneThemeService {
  private themes: Readonly<Record<string, OneResolvedTheme>> = DEFAULT_REGISTRY;
  private activeTheme = 'default';

  constructor(private readonly resolveRoot: OneThemeRootResolver) {}

  get currentTheme(): string {
    return this.activeTheme;
  }

  init(options?: OneThemeInitOptions): void {
    const normalized = normalizeOneThemeOptions(options);
    const root = this.requireRoot();
    const theme = normalized.themes[normalized.defaultTheme];
    applyTheme(root, normalized.defaultTheme, theme);
    this.themes = normalized.themes;
    this.activeTheme = normalized.defaultTheme;
  }

  switch(name: string): void {
    assertSwitchName(name);
    if (!Object.prototype.hasOwnProperty.call(this.themes, name)) {
      throw new OneThemeNotFoundError(name);
    }
    const root = this.requireRoot();
    applyTheme(root, name, this.themes[name]);
    this.activeTheme = name;
  }

  private requireRoot(): HTMLElement {
    const root = this.resolveRoot();
    if (!root) {
      throw new OneThemeEnvironmentError();
    }
    return root;
  }
}

function resolveDocumentRoot(): HTMLElement | undefined {
  return typeof document === 'undefined' ? undefined : document.documentElement;
}

export const oneTheme: OneThemeService = new DomOneThemeService(
  resolveDocumentRoot
);
