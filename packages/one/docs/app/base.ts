let oneDocBasePath = '';

export function normalizeOneDocBasePath(base: string): string {
  const trimmed = (base ?? '').trim();

  if (!trimmed || trimmed === '/') {
    return '';
  }

  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  return withLeading.endsWith('/') ? withLeading.slice(0, -1) : withLeading;
}

export function setOneDocBasePath(base: string): void {
  oneDocBasePath = normalizeOneDocBasePath(base);
}

export function getOneDocBasePath(): string {
  return oneDocBasePath;
}

export function withOneDocBasePath(
  path: string,
  base: string = oneDocBasePath
): string {
  if (!base) {
    return path;
  }

  return path === '/' ? `${base}/` : `${base}${path}`;
}

export function stripOneDocBasePath(
  path: string,
  base: string = oneDocBasePath
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

export function readOneDocBaseFromDocument(
  doc: Document | undefined
): string {
  return doc?.documentElement?.getAttribute('data-doc-base') ?? '';
}
