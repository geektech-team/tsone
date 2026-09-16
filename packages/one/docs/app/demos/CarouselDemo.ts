import { Component, type VNode } from '@geektech/tsone';
import { OneCarousel, type OneCarouselChangeEvent } from '../../../lib';
import { pick } from './locale';

interface CarouselDemoState {
  current: number;
}

function placeholderImage(color: string, label: string): string {
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="300">`,
    `<rect width="100%" height="100%" fill="${color}"/>`,
    `<text x="50%" y="50%" font-size="28" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${label}</text>`,
    `</svg>`,
  ].join('');
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const ITEMS = [
  {
    src: placeholderImage('#2f7c39', '城市天际线'),
    alt: pick('城市天际线', 'City skyline'),
    caption: pick('城市天际线', 'City skyline'),
  },
  {
    src: placeholderImage('#2563eb', '海港日落'),
    alt: pick('海港日落', 'Harbor sunset'),
    caption: pick('海港日落', 'Harbor sunset'),
  },
  {
    src: placeholderImage('#9a6700', '山间公路'),
    alt: pick('山间公路', 'Mountain road'),
    caption: pick('山间公路', 'Mountain road'),
  },
];

export class CarouselDemo extends Component<
  Record<string, never>,
  CarouselDemoState
> {
  private readonly handleChange = (payload: unknown): void => {
    const event = payload as OneCarouselChangeEvent;
    this.setState({ current: event.value });
  };

  protected initState(): CarouselDemoState {
    return { current: 0 };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-carousel-demo' },
      children: [
        {
          component: OneCarousel,
          props: {
            items: ITEMS,
            height: '280px',
            ariaLabel: pick('城市图片轮播', 'City image carousel'),
          },
          emitters: { change: this.handleChange },
        },
        {
          tag: 'output',
          props: { 'data-one-carousel-result': '' },
          children: [
            pick(
              `当前：第 ${this.state.current + 1} 张`,
              `Current: slide ${this.state.current + 1}`
            ),
          ],
        },
      ],
    };
  }
}
