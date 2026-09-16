import type { OneChartDocLocale } from './content';
import { withOneChartDocBasePath } from './base';

/**
 * 构建带语言前缀的页面链接。页面 path 恒为以 `/` 开头、以 `/` 结尾的绝对路径
 * （首页为 `/`），因此直接拼接 locale 前缀即可得到 `/zh/...` 或 `/en/...`。
 */
export function localeHref(
  path: string,
  locale: OneChartDocLocale
): string {
  return withOneChartDocBasePath(`/${locale}${path}`);
}

/** 按语言从一对中英文字符串中选择。 */
export function pick(
  zh: string,
  en: string,
  locale: OneChartDocLocale
): string {
  return locale === 'en' ? en : zh;
}
