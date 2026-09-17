import type {
  EventListeners,
  HTMLNode,
  HTMLProps,
  VNode,
} from '@geektech/tsone';

export type SvgChild = VNode | string;

/** 构造一个 SVG 元素 VNode。listeners 挂载在节点顶层。 */
export function svgElement(
  tag: string,
  props?: HTMLProps,
  children?: SvgChild[],
  listeners?: EventListeners
): HTMLNode {
  return { tag, props, children, ...(listeners ? { listeners } : {}) };
}

export function svgG(children?: SvgChild[], props?: HTMLProps): HTMLNode {
  return svgElement('g', props, children);
}

export function svgRect(props?: HTMLProps): HTMLNode {
  return svgElement('rect', props);
}

export function svgLine(props?: HTMLProps): HTMLNode {
  return svgElement('line', props);
}

export function svgCircle(props?: HTMLProps): HTMLNode {
  return svgElement('circle', props);
}

export function svgPath(d: string, props?: HTMLProps): HTMLNode {
  return svgElement('path', { d, ...props });
}

export function svgPolygon(points: string, props?: HTMLProps): HTMLNode {
  return svgElement('polygon', { points, ...props });
}

export function svgText(content: SvgChild | SvgChild[], props?: HTMLProps): HTMLNode {
  const children = Array.isArray(content) ? content : [content];
  return svgElement('text', props, children);
}

export function svgTspan(content: string, props?: HTMLProps): HTMLNode {
  return svgElement('tspan', props, [content]);
}

/** 数值序列化为 SVG 属性字符串，避免浮点长尾。 */
export function oneSvgNumber(value: number, maxFractionDigits = 2): string {
  if (!Number.isFinite(value)) {
    return '0';
  }
  const factor = 10 ** maxFractionDigits;
  return String(Math.round((value + Number.EPSILON) * factor) / factor);
}
