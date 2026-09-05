let cliDocBasePath = '';

export function normalizeCliDocBasePath(base: string): string {
  const trimmed = (base ?? '').trim();

  if (!trimmed || trimmed === '/') {
    return '';
  }

  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  return withLeading.endsWith('/') ? withLeading.slice(0, -1) : withLeading;
}

export function setCliDocBasePath(base: string): void {
  cliDocBasePath = normalizeCliDocBasePath(base);
}

export function getCliDocBasePath(): string {
  return cliDocBasePath;
}

export function withCliDocBasePath(
  path: string,
  base: string = cliDocBasePath
): string {
  if (!base) {
    return path;
  }

  return path === '/' ? `${base}/` : `${base}${path}`;
}

export function stripCliDocBasePath(
  path: string,
  base: string = cliDocBasePath
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

export function readCliDocBaseFromDocument(
  doc: Document | undefined
): string {
  return doc?.documentElement?.getAttribute('data-doc-base') ?? '';
}
