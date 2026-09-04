let docBasePath = '';

export function normalizeDocBasePath(base: string): string {
  const trimmed = (base ?? '').trim();

  if (!trimmed || trimmed === '/') {
    return '';
  }

  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  return withLeading.endsWith('/') ? withLeading.slice(0, -1) : withLeading;
}

export function setDocBasePath(base: string): void {
  docBasePath = normalizeDocBasePath(base);
}

export function getDocBasePath(): string {
  return docBasePath;
}

export function withDocBasePath(
  path: string,
  base: string = docBasePath
): string {
  if (!base) {
    return path;
  }

  return path === '/' ? `${base}/` : `${base}${path}`;
}

export function stripDocBasePath(
  path: string,
  base: string = docBasePath
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

export function readDocBaseFromDocument(
  doc: Document | undefined
): string {
  return doc?.documentElement?.getAttribute('data-doc-base') ?? '';
}
