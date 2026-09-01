import { ONE_DEFAULT_THEME } from './default-theme';
import { OneThemeConfigError } from './errors';
import type {
  OneResolvedTheme,
  OneThemeDefinition,
  OneThemeInitOptions,
} from './types';

export interface NormalizedOneThemeOptions {
  readonly themes: Readonly<Record<string, OneResolvedTheme>>;
  readonly defaultTheme: string;
}

const OPTION_KEYS = ['themes', 'defaultTheme'] as const;
const DEFINITION_KEYS = ['colors', 'typography', 'border', 'radius'] as const;
const COLOR_KEYS = [
  'primary',
  'primaryHover',
  'primaryContrast',
  'secondary',
  'secondaryHover',
  'secondaryContrast',
  'danger',
  'dangerHover',
  'dangerContrast',
  'info',
  'success',
  'warning',
  'overlay',
  'surface',
  'text',
  'muted',
  'focus',
] as const;
const TYPOGRAPHY_KEYS = [
  'fontFamily',
  'fontSizeSm',
  'fontSizeMd',
  'fontSizeLg',
  'lineHeight',
] as const;
const BORDER_KEYS = ['color', 'width', 'style'] as const;
const RADIUS_KEYS = ['sm', 'md', 'lg'] as const;

type StringRecord = Record<string, unknown>;

function isRecord(value: unknown): value is StringRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertRecord(
  value: unknown,
  path: string
): asserts value is StringRecord {
  if (!isRecord(value)) {
    throw new OneThemeConfigError(`${path} must be an object.`);
  }
}

function assertKnownKeys(
  value: StringRecord,
  allowedKeys: readonly string[],
  path: string
): void {
  const unknownKey = Object.keys(value).find(
    (key) => !allowedKeys.includes(key)
  );
  if (unknownKey) {
    throw new OneThemeConfigError(`${path}.${unknownKey} is not supported.`);
  }
}

function normalizeStringGroup<K extends string, T extends Record<K, string>>(
  value: unknown,
  fallback: T,
  allowedKeys: readonly (keyof T & string)[],
  path: string
): Readonly<T> {
  if (value === undefined) {
    return fallback;
  }

  assertRecord(value, path);
  assertKnownKeys(value, allowedKeys, path);
  const resolved = { ...fallback };
  for (const key of allowedKeys) {
    const candidate = value[key];
    if (candidate === undefined) {
      continue;
    }
    if (typeof candidate !== 'string' || candidate.trim().length === 0) {
      throw new OneThemeConfigError(
        `${path}.${key} must be a non-empty string.`
      );
    }
    resolved[key] = candidate as T[K];
  }
  return Object.freeze(resolved);
}

function normalizeTheme(value: unknown, path: string): OneResolvedTheme {
  assertRecord(value, path);
  assertKnownKeys(value, DEFINITION_KEYS, path);
  const definition = value as OneThemeDefinition;

  return Object.freeze({
    colors: normalizeStringGroup(
      definition.colors,
      ONE_DEFAULT_THEME.colors,
      COLOR_KEYS,
      `${path}.colors`
    ),
    typography: normalizeStringGroup(
      definition.typography,
      ONE_DEFAULT_THEME.typography,
      TYPOGRAPHY_KEYS,
      `${path}.typography`
    ),
    border: normalizeStringGroup(
      definition.border,
      ONE_DEFAULT_THEME.border,
      BORDER_KEYS,
      `${path}.border`
    ),
    radius: normalizeStringGroup(
      definition.radius,
      ONE_DEFAULT_THEME.radius,
      RADIUS_KEYS,
      `${path}.radius`
    ),
  });
}

function assertThemeName(name: string, path: string): void {
  if (name.length === 0 || name.trim() !== name || /\s/.test(name)) {
    throw new OneThemeConfigError(
      `${path} must be a non-empty name without whitespace.`
    );
  }
}

export function normalizeOneThemeOptions(
  options: OneThemeInitOptions = {}
): NormalizedOneThemeOptions {
  assertRecord(options, 'options');
  assertKnownKeys(options, OPTION_KEYS, 'options');

  const themes: Record<string, OneResolvedTheme> = {
    default: ONE_DEFAULT_THEME,
  };

  if (options.themes !== undefined) {
    assertRecord(options.themes, 'options.themes');
    for (const [name, definition] of Object.entries(options.themes)) {
      assertThemeName(name, `options.themes.${name || '<empty>'}`);
      if (name === 'default') {
        throw new OneThemeConfigError(
          'options.themes.default is reserved by One UI.'
        );
      }
      themes[name] = normalizeTheme(definition, `options.themes.${name}`);
    }
  }

  const defaultTheme = options.defaultTheme ?? 'default';
  if (typeof defaultTheme !== 'string') {
    throw new OneThemeConfigError('options.defaultTheme must be a string.');
  }
  assertThemeName(defaultTheme, 'options.defaultTheme');
  if (!(defaultTheme in themes)) {
    throw new OneThemeConfigError(
      `options.defaultTheme references unknown theme "${defaultTheme}".`
    );
  }

  return Object.freeze({
    themes: Object.freeze(themes),
    defaultTheme,
  });
}
