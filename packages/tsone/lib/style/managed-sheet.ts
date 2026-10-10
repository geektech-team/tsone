import type { StyleOptions } from './StyleManager';

function renderProperties(properties: Record<string, string | number>): string {
  return Object.entries(properties)
    .map(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssKey}: ${value};`;
    })
    .join('\n');
}

export function renderManagedStyleSheet(styles: Iterable<StyleOptions>): string {
  let css = '';
  for (const style of styles) {
    css += `${style.selector} {\n${renderProperties(style.properties)}\n}\n`;
    if (style.hover) {
      css += `${style.selector}:hover {\n${renderProperties(style.hover)}\n}\n`;
    }
    for (const [query, properties] of Object.entries(style.media ?? {})) {
      css += `@media ${query} {\n${style.selector} {\n${renderProperties(properties)}\n}\n}\n`;
    }
  }
  return css;
}
