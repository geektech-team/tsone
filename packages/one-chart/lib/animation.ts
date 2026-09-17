import { oneSvgNumber } from './svg';

export type OneChartEasing = 'linear' | 'easeOut' | 'easeInOut';

/**
 * 图表动画配置。`animation` 传对象时各项均可选，
 * 只传需要覆盖的项；传 `false` 完全关闭动画。
 */
export interface OneChartAnimationOptions {
  /** 动画时长（ms），默认 600。 */
  duration?: number;
  /** 缓动曲线，默认 easeOut。 */
  easing?: OneChartEasing;
  /** 初始化动画（图形从起点形态生长出现），默认 true。 */
  init?: boolean;
  /** 数据变更动画（图形从旧几何过渡到新几何），默认 true。 */
  update?: boolean;
  /** 容器大小变更动画（SVG 尺寸与 viewBox 平滑过渡），默认 true。 */
  resize?: boolean;
}

/** 归一化后的完整动画配置，字段均为有效值。 */
export interface ResolvedOneChartAnimationOptions
  extends OneChartAnimationOptions {
  duration: number;
  easing: OneChartEasing;
  init: boolean;
  update: boolean;
  resize: boolean;
}

export const ONE_CHART_ANIMATION_DEFAULT_DURATION = 600;
export const ONE_CHART_ANIMATION_DEFAULT_EASING: OneChartEasing = 'easeOut';

/** 缓动对应的 SMIL keySplines；linear 使用默认 calcMode，无需 spline。 */
const EASING_SPLINES: Record<OneChartEasing, string | null> = {
  linear: null,
  easeOut: '0.22 0.61 0.36 1',
  easeInOut: '0.33 0 0.67 1',
};

/**
 * 归一化动画配置。动画默认开启；`animation === false`、
 * 或系统启用「减少动态效果」时返回 null 表示禁用。
 */
export function oneResolveAnimationOptions(
  animation: boolean | OneChartAnimationOptions | undefined,
  prefersReducedMotion = false
): ResolvedOneChartAnimationOptions | null {
  if (animation === false || prefersReducedMotion) {
    return null;
  }
  const source: OneChartAnimationOptions =
    animation && typeof animation === 'object' ? animation : {};
  const duration =
    typeof source.duration === 'number' &&
    Number.isFinite(source.duration) &&
    source.duration >= 0
      ? source.duration
      : ONE_CHART_ANIMATION_DEFAULT_DURATION;
  const easing =
    source.easing !== undefined && source.easing in EASING_SPLINES
      ? source.easing
      : ONE_CHART_ANIMATION_DEFAULT_EASING;
  return {
    duration,
    easing,
    init: source.init !== false,
    update: source.update !== false,
    resize: source.resize !== false,
  };
}

/** 声明元素参与动画的几何属性（逗号分隔，写入 data-one-chart-anim）。 */
export function oneAnimAttrs(attrs: readonly string[]): Record<string, string> {
  return { 'data-one-chart-anim': attrs.join(',') };
}

/** 声明元素的稳定标识，用于数据变更时匹配新旧节点。 */
export function oneAnimKey(key: string): Record<string, string> {
  return { 'data-one-chart-anim-key': key };
}

/**
 * 声明元素的初始化动画起点（写入 data-one-chart-anim-from）。
 * 每一项为「属性=起点值」，分号分隔，如 `height=0;y=300`。
 */
export function oneAnimFrom(
  entries: ReadonlyArray<readonly [string, string | number]>
): Record<string, string> {
  return {
    'data-one-chart-anim-from': entries
      .map(([name, value]) => {
        const text =
          typeof value === 'number' ? oneSvgNumber(value) : String(value);
        return `${name}=${text}`;
      })
      .join(';'),
  };
}

/** 解析初始化起点；属性缺失或格式非法时返回 null。 */
export function oneParseAnimFrom(
  value: string | null
): Record<string, string> | null {
  if (!value) {
    return null;
  }
  const result: Record<string, string> = {};
  for (const entry of value.split(';')) {
    const separator = entry.indexOf('=');
    if (separator <= 0) {
      return null;
    }
    result[entry.slice(0, separator)] = entry.slice(separator + 1);
  }
  return result;
}

/**
 * 创建 SMIL `<animate>` 元素（带 data-one-chart-animate 标记，
 * 由基类统一管理生命周期）。动画完成后 freeze 在目标值。
 */
export function oneCreateAnimateElement(
  attributeName: string,
  from: string,
  to: string,
  options: { duration: number; easing: OneChartEasing }
): Element {
  const element = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'animate'
  );
  element.setAttribute('data-one-chart-animate', '');
  element.setAttribute('attributeName', attributeName);
  element.setAttribute('from', from);
  element.setAttribute('to', to);
  element.setAttribute('dur', `${options.duration / 1000}s`);
  element.setAttribute('fill', 'freeze');
  const spline = EASING_SPLINES[options.easing];
  if (spline) {
    element.setAttribute('calcMode', 'spline');
    element.setAttribute('keyTimes', '0;1');
    element.setAttribute('keySplines', spline);
  }
  return element;
}
