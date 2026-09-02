import type { OneDocLocale } from '../content';

let currentLocale: OneDocLocale = 'zh';

/** 挂载交互式 demo 前，根据页面语言设置当前语言。 */
export function setDemoLocale(locale: OneDocLocale): void {
  currentLocale = locale;
}

/** 按当前语言从一对中英文字符串中选择。 */
export function pick(zh: string, en: string): string {
  return currentLocale === 'en' ? en : zh;
}
