import type { CliDocLocale } from './content';
import { withCliDocBasePath } from './base';

export function pick(zh: string, en: string, locale: CliDocLocale): string {
  return locale === 'en' ? en : zh;
}

/**
 * 构建带语言前缀的页面链接。页面 path 恒为以 `/` 开头、以 `/` 结尾的绝对路径
 * （首页为 `/`），因此直接拼接 locale 前缀即可得到 `/zh/...` 或 `/en/...`。
 * 配置 base path 时（如 GitHub Pages 项目页），链接会额外带上该前缀。
 */
export function localeHref(path: string, locale: CliDocLocale): string {
  return withCliDocBasePath(`/${locale}${path}`);
}
