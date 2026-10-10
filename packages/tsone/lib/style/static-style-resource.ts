const resources = new Map<string, Promise<string | null>>();

export function fetchStaticStyleSheet(href: string): Promise<string | null> {
  const existing = resources.get(href);
  if (existing) return existing;
  const pending: Promise<string | null> = Promise.resolve()
    .then(() => fetch(href))
    .then(response => response.ok ? response.text() : null)
    .catch(() => null)
    .then(css => {
      if (css === null && resources.get(href) === pending) resources.delete(href);
      return css;
    });
  resources.set(href, pending);
  return pending;
}
