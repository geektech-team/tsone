import { oneSvgNumber } from './svg';

export type OnePoint = readonly [number, number];

/** 折线 path（M/L 分段）。 */
export function oneLinePath(points: ReadonlyArray<OnePoint>): string {
  if (points.length === 0) {
    return '';
  }
  let d = `M${oneSvgNumber(points[0][0])} ${oneSvgNumber(points[0][1])}`;
  for (let index = 1; index < points.length; index += 1) {
    d += ` L${oneSvgNumber(points[index][0])} ${oneSvgNumber(points[index][1])}`;
  }
  return d;
}

/**
 * 平滑折线 path（Catmull-Rom 转三次贝塞尔）。
 * 少于 3 个点时退化为直线。
 */
export function oneSmoothLinePath(points: ReadonlyArray<OnePoint>): string {
  if (points.length < 3) {
    return oneLinePath(points);
  }
  let d = `M${oneSvgNumber(points[0][0])} ${oneSvgNumber(points[0][1])}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${oneSvgNumber(c1x)} ${oneSvgNumber(c1y)}, ${oneSvgNumber(c2x)} ${oneSvgNumber(
      c2y
    )}, ${oneSvgNumber(p2[0])} ${oneSvgNumber(p2[1])}`;
  }
  return d;
}

/** 面积 path：上边线 + 闭合到基线。 */
export function oneAreaPath(
  points: ReadonlyArray<OnePoint>,
  baselineY: number,
  curve: 'linear' | 'smooth' = 'linear'
): string {
  if (points.length === 0) {
    return '';
  }
  const top = curve === 'smooth' ? oneSmoothLinePath(points) : oneLinePath(points);
  const first = points[0];
  const last = points[points.length - 1];
  return `${top} L${oneSvgNumber(last[0])} ${oneSvgNumber(baselineY)} L${oneSvgNumber(
    first[0]
  )} ${oneSvgNumber(baselineY)} Z`;
}

/** 极坐标转平面坐标，angle 为弧度。 */
export function onePolarPoint(
  cx: number,
  cy: number,
  radius: number,
  angle: number
): OnePoint {
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
}

/** 闭合多边形 path。 */
export function onePolygonPath(points: ReadonlyArray<OnePoint>): string {
  if (points.length === 0) {
    return '';
  }
  return `${oneLinePath(points)} Z`;
}

/** 多边形 points 属性串（"x,y x,y …"），供 <polygon points> 使用。 */
export function onePolygonPoints(points: ReadonlyArray<OnePoint>): string {
  return points
    .map(([x, y]) => `${oneSvgNumber(x)},${oneSvgNumber(y)}`)
    .join(' ');
}

/**
 * 饼图扇区 path。角度为弧度，0 指向 3 点钟方向，沿 SVG 屏幕坐标顺时针。
 * innerRadius 大于 0 时生成环形扇区（甜甜圈）。
 * padAngle 为弧度，会在扇区两端对称收缩，且不超过扇区跨度的一半。
 */
export function oneArcPath(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
  padAngle = 0
): string {
  const sweep = endAngle - startAngle;
  if (sweep <= 0 || outerRadius <= 0) {
    return '';
  }

  // 整圆（单数据项铺满一周）直接拆两段半圆弧，忽略 padAngle
  if (sweep >= Math.PI * 2 - 1e-6) {
    return buildFullCirclePath(cx, cy, outerRadius, innerRadius, startAngle);
  }

  const padding = Math.min(Math.max(padAngle, 0), sweep / 2);
  const a0 = startAngle + padding;
  const a1 = endAngle - padding;

  const largeArc = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = onePolarPoint(cx, cy, outerRadius, a0);
  const [x1, y1] = onePolarPoint(cx, cy, outerRadius, a1);

  if (innerRadius <= 0) {
    return `M${oneSvgNumber(x0)} ${oneSvgNumber(y0)} A${oneSvgNumber(
      outerRadius
    )} ${oneSvgNumber(outerRadius)} 0 ${largeArc} 1 ${oneSvgNumber(
      x1
    )} ${oneSvgNumber(y1)} L${oneSvgNumber(cx)} ${oneSvgNumber(cy)} Z`;
  }

  const [ix0, iy0] = onePolarPoint(cx, cy, innerRadius, a1);
  const [ix1, iy1] = onePolarPoint(cx, cy, innerRadius, a0);
  return `M${oneSvgNumber(x0)} ${oneSvgNumber(y0)} A${oneSvgNumber(
    outerRadius
  )} ${oneSvgNumber(outerRadius)} 0 ${largeArc} 1 ${oneSvgNumber(
    x1
  )} ${oneSvgNumber(y1)} L${oneSvgNumber(ix0)} ${oneSvgNumber(
    iy0
  )} A${oneSvgNumber(innerRadius)} ${oneSvgNumber(innerRadius)} 0 ${largeArc} 0 ${oneSvgNumber(
    ix1
  )} ${oneSvgNumber(iy1)} Z`;
}

/** 整圆扇区（单数据项饼图）拆成两段半圆弧。 */
function buildFullCirclePath(  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number
): string {
  const midAngle = startAngle + Math.PI;
  const [mx, my] = onePolarPoint(cx, cy, outerRadius, midAngle);
  const [x0, y0] = onePolarPoint(cx, cy, outerRadius, startAngle);
  const outer = `M${oneSvgNumber(x0)} ${oneSvgNumber(y0)} A${oneSvgNumber(
    outerRadius
  )} ${oneSvgNumber(outerRadius)} 0 1 1 ${oneSvgNumber(mx)} ${oneSvgNumber(
    my
  )} A${oneSvgNumber(outerRadius)} ${oneSvgNumber(outerRadius)} 0 1 1 ${oneSvgNumber(
    x0
  )} ${oneSvgNumber(y0)}`;

  if (innerRadius <= 0) {
    return `${outer} Z`;
  }

  const [imx, imy] = onePolarPoint(cx, cy, innerRadius, midAngle);
  const [ix0, iy0] = onePolarPoint(cx, cy, innerRadius, startAngle);
  const inner = `M${oneSvgNumber(ix0)} ${oneSvgNumber(iy0)} A${oneSvgNumber(
    innerRadius
  )} ${oneSvgNumber(innerRadius)} 0 1 0 ${oneSvgNumber(imx)} ${oneSvgNumber(
    imy
  )} A${oneSvgNumber(innerRadius)} ${oneSvgNumber(innerRadius)} 0 1 0 ${oneSvgNumber(
    ix0
  )} ${oneSvgNumber(iy0)}`;
  return `${outer} ${inner}`;
}

/**
 * 零跨度扇区 path：弧线收缩为起始角上的一点，作为饼图初始化动画的起点。
 * 命令结构与 {@link oneArcPath} 输出一致（M/A/L/A/Z），可被 SMIL 直接形变。
 */
export function oneCollapsedArcPath(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  angle: number,
  _padAngle = 0
): string {
  const [x0, y0] = onePolarPoint(cx, cy, outerRadius, angle);
  if (innerRadius <= 0) {
    return `M${oneSvgNumber(x0)} ${oneSvgNumber(y0)} A${oneSvgNumber(
      outerRadius
    )} ${oneSvgNumber(outerRadius)} 0 0 1 ${oneSvgNumber(x0)} ${oneSvgNumber(
      y0
    )} L${oneSvgNumber(cx)} ${oneSvgNumber(cy)} Z`;
  }
  const [ix0, iy0] = onePolarPoint(cx, cy, innerRadius, angle);
  return `M${oneSvgNumber(x0)} ${oneSvgNumber(y0)} A${oneSvgNumber(
    outerRadius
  )} ${oneSvgNumber(outerRadius)} 0 0 1 ${oneSvgNumber(x0)} ${oneSvgNumber(
    y0
  )} L${oneSvgNumber(ix0)} ${oneSvgNumber(iy0)} A${oneSvgNumber(
    innerRadius
  )} ${oneSvgNumber(innerRadius)} 0 0 0 ${oneSvgNumber(ix0)} ${oneSvgNumber(
    iy0
  )} Z`;
}
