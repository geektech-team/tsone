import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export interface StaticStyleAsset { filename: string; cssText: string; }

export function canExternalizeCss(css: string): boolean {
  let index = 0;
  const whitespace = (): boolean => {
    while (index < css.length) {
      if (/\s/.test(css[index])) { index++; continue; }
      if (css.startsWith('/*', index)) {
        const end = css.indexOf('*/', index + 2);
        if (end < 0) return false;
        index = end + 2;
        continue;
      }
      break;
    }
    return true;
  };
  const quoted = (): string | undefined => {
    const quote = css[index++];
    let result = '';
    while (index < css.length) {
      const character = css[index++];
      if (character === '\\') return undefined;
      if (character === quote) return result;
      result += character;
    }
    return undefined;
  };
  while (index < css.length) {
    if (!whitespace()) return false;
    if (index >= css.length) break;
    const character = css[index];
    if (character === '\\') return false;
    if (character === '"' || character === "'") {
      if (quoted() === undefined) return false;
      continue;
    }
    if (character === '@' || /[a-z_-]/i.test(character)) {
      const start = index++;
      while (index < css.length && /[a-z0-9_-]/i.test(css[index])) index++;
      const token = css.slice(start, index).toLowerCase();
      if (token === '@import') return false;
      if (!whitespace()) return false;
      if (css[index] !== '(') continue;
      if (['image-set', '-webkit-image-set', 'image', 'src'].includes(token)) return false;
      if (token !== 'url') continue;
      index++;
      if (!whitespace()) return false;
      let address: string | undefined;
      if (css[index] === '"' || css[index] === "'") {
        address = quoted();
        if (address === undefined || !whitespace() || css[index++] !== ')') return false;
      } else {
        const begin = index;
        while (index < css.length && css[index] !== ')') {
          if (['(', '\\', '"', "'"].includes(css[index])) return false;
          index++;
        }
        if (index >= css.length) return false;
        address = css.slice(begin, index++).trim();
      }
      if (!address || !(/^[a-z][a-z0-9+.-]*:/i.test(address) || address.startsWith('/'))) return false;
      continue;
    }
    index++;
  }
  return true;
}

export function makeStaticStyleAsset(cssText: string): StaticStyleAsset {
  const hash = new Bun.CryptoHasher('sha256').update(cssText).digest('hex');
  return { filename: `tsone-static-${hash}.css`, cssText };
}

export async function externalizeDocumentStyles(html: string): Promise<{ html: string; assets: StaticStyleAsset[] }> {
  const sheets: string[] = [];
  let active: number | undefined;
  let hasBase = false;
  const selector = 'head > style[data-tsone-document-style]';
  await new HTMLRewriter().on('base', { element() { hasBase = true; } })
    .on(selector, {
      element(element) {
        active = sheets.length;
        sheets.push('');
        element.onEndTag(() => { active = undefined; });
      },
      text(chunk) { if (active !== undefined) sheets[active] += chunk.text; },
    }).transform(new Response(html)).text();
  if (hasBase) return { html, assets: [] };
  const replacements = sheets.map(css => css.trim() && canExternalizeCss(css) ? makeStaticStyleAsset(css) : undefined);
  const assets = [...new Map(replacements.filter((asset): asset is StaticStyleAsset => asset !== undefined)
    .map(asset => [asset.filename, asset])).values()];
  if (assets.length === 0) return { html, assets };
  let index = 0;
  const rewritten = await new HTMLRewriter().on(selector, {
    element(element) {
      const asset = replacements[index++];
      if (asset) element.replace(`<link rel="stylesheet" href="./${asset.filename}">`, { html: true });
    },
  }).transform(new Response(html)).text();
  return { html: rewritten, assets };
}

export async function writeStaticStyleAssets(htmlFile: string, assets: readonly StaticStyleAsset[]): Promise<string[]> {
  const directory = dirname(htmlFile);
  await mkdir(directory, { recursive: true });
  const paths = new Set<string>();
  for (const asset of assets) {
    const path = resolve(directory, asset.filename);
    if (paths.has(path)) continue;
    let existing: string | undefined;
    try { existing = await readFile(path, 'utf8'); } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    if (existing !== undefined && existing !== asset.cssText) throw new Error(`Static CSS filename collision: ${path}`);
    if (existing === undefined) await writeFile(path, asset.cssText, { flag: 'wx' });
    paths.add(path);
  }
  return [...paths];
}
