let backOneDocBasePath = '';

export function normalizeBackOneDocBasePath(base: string): string {
  const trimmed = (base ?? '').trim();

  if (!trimmed || trimmed === '/') {
    return '';
  }

  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  return withLeading.endsWith('/') ? withLeading.slice(0, -1) : withLeading;
}

export function setBackOneDocBasePath(base: string): void {
  backOneDocBasePath = normalizeBackOneDocBasePath(base);
}

export function getBackOneDocBasePath(): string {
  return backOneDocBasePath;
}

export function withBackOneDocBasePath(
  path: string,
  base: string = backOneDocBasePath
): string {
  if (!base) {
    return path;
  }

  return path === '/' ? `${base}/` : `${base}${path}`;
}

export function stripBackOneDocBasePath(
  path: string,
  base: string = backOneDocBasePath
): string {
  if (!base) {
    return path;
  }

  if (path === base) {
    return '/';
  }

  const prefix = `${base}/`;

  return path.startsWith(prefix) ? path.slice(base.length) : path;
}

export function readBackOneDocBaseFromDocument(
  doc: Document | undefined
): string {
  return doc?.documentElement?.getAttribute('data-doc-base') ?? '';
}
