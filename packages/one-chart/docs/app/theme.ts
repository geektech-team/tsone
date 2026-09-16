/** docs 主题在 localStorage 中的存储键。SSR 引导脚本与客户端必须保持一致。 */
export const ONE_CHART_DOCS_THEME_KEY = 'one-chart-docs-theme';

export type OneChartDocsTheme = 'default' | 'dark';

export function isOneChartDocsTheme(value: unknown): value is OneChartDocsTheme {
  return value === 'default' || value === 'dark';
}
