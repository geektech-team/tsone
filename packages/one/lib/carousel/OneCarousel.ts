import { Component, type VNode } from '@geektech/tsone';
import {
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  type OneNamedStyle,
} from '../styles/shared';

export interface OneCarouselItem {
  src: string;
  alt?: string;
  caption?: string;
}

export interface OneCarouselChangeEvent {
  value: number;
  originalEvent: Event;
}

export interface OneCarouselProps {
  items: readonly OneCarouselItem[];
  value?: number;
  defaultValue?: number;
  autoplay?: boolean;
  interval?: number;
  pauseOnHover?: boolean;
  loop?: boolean;
  showArrows?: boolean;
  showDots?: boolean;
  height?: string;
  ariaLabel?: string;
}

interface OneCarouselState {
  internalValue: number;
}

export const ONE_CAROUSEL_DEFAULT_HEIGHT = '240px';
export const ONE_CAROUSEL_DEFAULT_INTERVAL = 4000;

export function normalizeOneCarouselIndex(
  value: number | undefined,
  count: number,
  fallback = 0
): number {
  const numeric =
    typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : NaN;
  return Number.isNaN(numeric) ? fallback : clampOneCarouselIndex(numeric, count);
}

export function clampOneCarouselIndex(value: number, count: number): number {
  if (count <= 0) {
    return 0;
  }
  return Math.min(count - 1, Math.max(0, value));
}

function normalizeOneCarouselInterval(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : ONE_CAROUSEL_DEFAULT_INTERVAL;
}

export const ONE_CAROUSEL_STYLES: OneNamedStyle[] = [
  {
    name: 'one-carousel-base',
    selector: '.one-carousel',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      position: 'relative',
      overflow: 'hidden',
      borderRadius: `var(--one-radius-md, ${ONE_THEME_DEFAULTS.radiusMd})`,
      backgroundColor: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
    },
  },
  {
    name: 'one-carousel-track',
    selector: '.one-carousel__track',
    properties: {
      display: 'flex',
      height: '100%',
      transition: 'transform 300ms ease',
    },
  },
  {
    name: 'one-carousel-slide',
    selector: '.one-carousel__slide',
    properties: {
      position: 'relative',
      flex: '0 0 100%',
      minWidth: '0',
      height: '100%',
    },
  },
  {
    name: 'one-carousel-image',
    selector: '.one-carousel__image',
    properties: {
      display: 'block',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
  },
  {
    name: 'one-carousel-caption',
    selector: '.one-carousel__caption',
    properties: {
      position: 'absolute',
      right: '0',
      bottom: '0',
      left: '0',
      padding: `${ONE_THEME_DEFAULTS.spaceLg} ${ONE_THEME_DEFAULTS.spaceMd} ${ONE_THEME_DEFAULTS.spaceMd}`,
      color: '#ffffff',
      fontSize: `var(--one-font-size-sm, ${ONE_THEME_DEFAULTS.fontSizeSm})`,
      background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.55))',
    },
  },
  {
    name: 'one-carousel-arrow',
    selector: '.one-carousel__arrow',
    properties: {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      padding: '0',
      border: '0',
      borderRadius: '50%',
      color: '#ffffff',
      backgroundColor: 'rgba(22, 32, 24, 0.45)',
      cursor: 'pointer',
      font: 'inherit',
      fontSize: '18px',
      lineHeight: '1',
    },
    hover: {
      backgroundColor: 'rgba(22, 32, 24, 0.65)',
    },
  },
  {
    name: 'one-carousel-arrow-prev',
    selector: '.one-carousel__arrow--prev',
    properties: { left: ONE_THEME_DEFAULTS.spaceMd },
  },
  {
    name: 'one-carousel-arrow-next',
    selector: '.one-carousel__arrow--next',
    properties: { right: ONE_THEME_DEFAULTS.spaceMd },
  },
  {
    name: 'one-carousel-arrow-disabled',
    selector: '.one-carousel__arrow:disabled',
    properties: { opacity: '0.4', cursor: 'not-allowed' },
  },
  {
    name: 'one-carousel-dots',
    selector: '.one-carousel__dots',
    properties: {
      position: 'absolute',
      right: '0',
      bottom: ONE_THEME_DEFAULTS.spaceSm,
      left: '0',
      display: 'flex',
      justifyContent: 'center',
      gap: ONE_THEME_DEFAULTS.spaceXs,
    },
  },
  {
    name: 'one-carousel-dot',
    selector: '.one-carousel__dot',
    properties: {
      width: '8px',
      height: '8px',
      padding: '0',
      border: '0',
      borderRadius: '50%',
      backgroundColor: 'rgba(255, 255, 255, 0.45)',
      cursor: 'pointer',
    },
  },
  {
    name: 'one-carousel-dot-active',
    selector: '.one-carousel__dot[aria-current="true"]',
    properties: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
    },
  },
  {
    name: 'one-carousel-control-focus-visible',
    selector:
      '.one-carousel:focus-visible, .one-carousel__arrow:focus-visible, .one-carousel__dot:focus-visible',
    properties: {
      outline: `2px solid var(--one-color-focus, ${ONE_THEME_DEFAULTS.colorFocus})`,
      outlineOffset: '-2px',
    },
  },
];

export class OneCarousel extends Component<OneCarouselProps, OneCarouselState> {
  private timer: ReturnType<typeof setInterval> | null = null;
  private hoverPaused = false;
  private autoplayKey = '';

  protected initState(): OneCarouselState {
    return {
      internalValue: normalizeOneCarouselIndex(
        this.props.defaultValue,
        this.normalizedItems().length
      ),
    };
  }

  protected initStyles(): void {
    ONE_CAROUSEL_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected onMounted(): void {
    this.syncAutoplay();
  }

  protected onUpdated(): void {
    this.syncAutoplay();
  }

  protected onUnmounted(): void {
    this.stopAutoplay();
  }

  protected render(): VNode {
    const items = this.normalizedItems();
    const count = items.length;
    const value = this.effectiveValue();
    const height = this.props.height ?? ONE_CAROUSEL_DEFAULT_HEIGHT;
    const multiple = count > 1;
    const showArrows = this.props.showArrows !== false;
    const showDots = this.props.showDots !== false;

    return {
      tag: 'div',
      props: {
        className: 'one-carousel',
        role: 'region',
        'aria-roledescription': 'carousel',
        'aria-label': this.props.ariaLabel ?? '图片轮播',
        tabindex: multiple ? 0 : undefined,
        style: { height },
      },
      listeners: {
        keydown: (event) => this.handleKeydown(event),
        pointerenter: () => {
          this.hoverPaused = true;
        },
        pointerleave: () => {
          this.hoverPaused = false;
        },
      },
      children: [
        {
          tag: 'div',
          props: {
            className: 'one-carousel__track',
            style: { transform: `translateX(-${value * 100}%)` },
          },
          children: items.map((item, index) => ({
            tag: 'div',
            props: {
              className: 'one-carousel__slide',
              role: 'group',
              'aria-roledescription': 'slide',
              'aria-label':
                item.alt ??
                item.caption ??
                `${index + 1} / ${count}`,
              'aria-hidden': index === value ? undefined : 'true',
            },
            children: [
              {
                tag: 'img',
                props: {
                  className: 'one-carousel__image',
                  src: item.src,
                  alt: item.alt ?? '',
                  draggable: 'false',
                },
              },
              ...(item.caption
                ? [
                    {
                      tag: 'div',
                      props: { className: 'one-carousel__caption' },
                      children: [item.caption],
                    } as VNode,
                  ]
                : []),
            ],
          })),
        },
        ...(showArrows && multiple
          ? [
              {
                tag: 'button',
                props: {
                  className: 'one-carousel__arrow one-carousel__arrow--prev',
                  type: 'button',
                  'aria-label': '上一张',
                  disabled: this.props.loop === false && value <= 0,
                },
                listeners: {
                  click: (event) => this.prev(event),
                },
                children: ['‹'],
              } as VNode,
              {
                tag: 'button',
                props: {
                  className: 'one-carousel__arrow one-carousel__arrow--next',
                  type: 'button',
                  'aria-label': '下一张',
                  disabled: this.props.loop === false && value >= count - 1,
                },
                listeners: {
                  click: (event) => this.next(event),
                },
                children: ['›'],
              } as VNode,
            ]
          : []),
        ...(showDots && multiple
          ? [
              {
                tag: 'div',
                props: {
                  className: 'one-carousel__dots',
                  role: 'group',
                  'aria-label': '幻灯片指示',
                },
                children: items.map((_, index) => ({
                  tag: 'button',
                  props: {
                    className: 'one-carousel__dot',
                    type: 'button',
                    'aria-label': `第 ${index + 1} 张`,
                    'aria-current': index === value ? 'true' : undefined,
                  },
                  listeners: {
                    click: (event) => this.goTo(index, event),
                  },
                })),
              } as VNode,
            ]
          : []),
      ],
    };
  }

  private normalizedItems(): OneCarouselItem[] {
    const items = Array.isArray(this.props.items) ? this.props.items : [];
    return items.filter(
      (item) =>
        !!item && typeof item.src === 'string' && item.src.length > 0
    );
  }

  private effectiveValue(): number {
    const count = this.normalizedItems().length;
    const raw = this.props.value ?? this.state.internalValue;
    return normalizeOneCarouselIndex(raw, count);
  }

  private goTo(index: number, event: Event): void {
    const count = this.normalizedItems().length;
    if (count === 0) {
      return;
    }
    const next = clampOneCarouselIndex(index, count);
    if (next === this.effectiveValue()) {
      return;
    }
    if (this.props.value === undefined) {
      this.setState({ internalValue: next });
    }
    this.emit('change', {
      value: next,
      originalEvent: event,
    } satisfies OneCarouselChangeEvent);
  }

  private next(event: Event): void {
    const count = this.normalizedItems().length;
    const current = this.effectiveValue();
    if (this.props.loop === false && current >= count - 1) {
      return;
    }
    this.goTo(current + 1 >= count ? 0 : current + 1, event);
  }

  private prev(event: Event): void {
    const count = this.normalizedItems().length;
    const current = this.effectiveValue();
    if (this.props.loop === false && current <= 0) {
      return;
    }
    this.goTo(current - 1 < 0 ? count - 1 : current - 1, event);
  }

  private handleKeydown(event: Event): void {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }
    if (event.target !== this.getElement()) {
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prev(event);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next(event);
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.goTo(0, event);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.goTo(this.normalizedItems().length - 1, event);
    }
  }

  private syncAutoplay(): void {
    const key = `${this.props.autoplay === true}:${
      this.props.interval ?? ONE_CAROUSEL_DEFAULT_INTERVAL
    }`;
    if (key === this.autoplayKey) {
      return;
    }
    this.autoplayKey = key;
    this.stopAutoplay();
    if (this.props.autoplay === true && this.normalizedItems().length > 1) {
      this.startAutoplay();
    }
  }

  private startAutoplay(): void {
    const interval = normalizeOneCarouselInterval(this.props.interval);
    this.timer = setInterval(() => {
      if (this.hoverPaused) {
        return;
      }
      const count = this.normalizedItems().length;
      if (count <= 1) {
        return;
      }
      const current = this.effectiveValue();
      if (this.props.loop === false && current >= count - 1) {
        this.stopAutoplay();
        return;
      }
      this.next(new Event('one-carousel:autoplay'));
    }, interval);
  }

  private stopAutoplay(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
