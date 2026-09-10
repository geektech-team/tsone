import type { BackOneDocLocale } from './content';
import { withBackOneDocBasePath } from './base';

/**
 * 构建带语言前缀的页面链接。页面 path 恒为以 `/` 开头、以 `/` 结尾的绝对路径
 * （首页为 `/`），因此直接拼接 locale 前缀即可得到 `/zh/...` 或 `/en/...`。
 * 配置 base path 时（如 GitHub Pages 项目页），链接会额外带上该前缀。
 */
export function localeHref(path: string, locale: BackOneDocLocale): string {
  return withBackOneDocBasePath(`/${locale}${path}`);
}

/** 按语言从一对中英文字符串中选择。 */
export function pick(zh: string, en: string, locale: BackOneDocLocale): string {
  return locale === 'en' ? en : zh;
}
