/** docs 主题在 localStorage 中的存储键。SSR 引导脚本与客户端必须保持一致。 */
export const BACKONE_DOCS_THEME_KEY = 'backone-docs-theme';

export type BackOneDocsTheme = 'default' | 'dark';

export function isBackOneDocsTheme(value: unknown): value is BackOneDocsTheme {
  return value === 'default' || value === 'dark';
}
