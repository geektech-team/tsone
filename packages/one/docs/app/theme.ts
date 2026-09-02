/** docs 主题在 localStorage 中的存储键。SSR 引导脚本与客户端必须保持一致。 */
export const ONE_DOCS_THEME_KEY = 'one-docs-theme';

export type OneDocsTheme = 'default' | 'dark';

export function isOneDocsTheme(value: unknown): value is OneDocsTheme {
  return value === 'default' || value === 'dark';
}
