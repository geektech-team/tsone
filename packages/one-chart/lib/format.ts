/** 默认数值格式化：整数原样，小数最多保留两位并去尾零。 */
export function oneDefaultValueFormat(value: number): string {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  if (Number.isInteger(value)) {
    return String(value);
  }
  return String(Math.round(value * 100) / 100);
}

/** 截断文本，超长时以省略号结尾。 */
export function truncateOneChartText(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars)}…`;
}

/** 百分比标签：整数不带小数，否则保留一位。 */
export function onePercentLabel(percent: number): string {
  if (!Number.isFinite(percent)) {
    return '0%';
  }
  return Number.isInteger(percent) ? `${percent}%` : `${percent.toFixed(1)}%`;
}
