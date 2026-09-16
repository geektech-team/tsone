let oneChartDocBasePath = '';

export function normalizeOneChartDocBasePath(base: string): string {
  const trimmed = (base ?? '').trim();

  if (!trimmed || trimmed === '/') {
    return '';
  }

  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  return withLeading.endsWith('/') ? withLeading.slice(0, -1) : withLeading;
}

export function setOneChartDocBasePath(base: string): void {
  oneChartDocBasePath = normalizeOneChartDocBasePath(base);
}

export function getOneChartDocBasePath(): string {
  return oneChartDocBasePath;
}

export function withOneChartDocBasePath(
  path: string,
  base: string = oneChartDocBasePath
): string {
  if (!base) {
    return path;
  }

  return path === '/' ? `${base}/` : `${base}${path}`;
}

export function readOneChartDocBaseFromDocument(
  doc: Document | undefined
): string {
  return doc?.documentElement?.getAttribute('data-doc-base') ?? '';
}
