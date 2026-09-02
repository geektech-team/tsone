import { Component, type VNode } from '@geektech/tsone';
import {
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  type OneNamedStyle,
} from '../styles/shared';

export interface OneRateValueEvent {
  value: number;
  originalEvent: Event;
}

export interface OneRateProps {
  value?: number;
  defaultValue?: number;
  count?: number;
  disabled?: boolean;
  readonly?: boolean;
  allowClear?: boolean;
  ariaLabel?: string;
}

interface OneRateState {
  internalValue: number;
}

export const ONE_RATE_STYLES: OneNamedStyle[] = [
  {
    name: 'one-rate-base',
    selector: '.one-rate',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '2px',
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
    },
  },
  {
    name: 'one-rate-star',
    selector: '.one-rate__star',
    properties: {
      appearance: 'none',
      border: 'none',
      background: 'transparent',
      padding: '2px',
      fontSize: '22px',
      lineHeight: '1',
      cursor: 'pointer',
      color: `var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
      transition: 'color 120ms ease',
    },
  },
  {
    name: 'one-rate-star-filled',
    selector: '.one-rate__star--filled',
    properties: {
      color: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
  },
  {
    name: 'one-rate-star-hover',
    selector: '.one-rate__star:hover:not(:disabled)',
    properties: {
      color: `var(--one-color-primary-hover, ${ONE_THEME_DEFAULTS.colorPrimaryHover})`,
    },
  },
  {
    name: 'one-rate-readonly',
    selector: '.one-rate--readonly .one-rate__star',
    properties: { cursor: 'default' },
  },
  {
    name: 'one-rate-disabled',
    selector: '.one-rate--disabled',
    properties: { opacity: '0.5' },
  },
];

export function normalizeOneRateValue(
  value: number | undefined,
  fallback: number
): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export class OneRate extends Component<OneRateProps, OneRateState> {
  protected initState(): OneRateState {
    return {
      internalValue: normalizeOneRateValue(this.props.defaultValue, 0),
    };
  }

  protected initStyles(): void {
    ONE_RATE_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    const count = this.getCount();
    const rawValue = normalizeOneRateValue(
      this.props.value ?? this.state.internalValue,
      0
    );
    const value = Math.min(count, Math.max(0, rawValue));
    const disabled = this.props.disabled === true;
    const readonly = this.props.readonly === true;
    const stars: VNode[] = [];

    for (let index = 1; index <= count; index += 1) {
      const filled = index <= value;
      stars.push({
        tag: 'button',
        props: {
          type: 'button',
          role: 'radio',
          className: [
            'one-rate__star',
            ...(filled ? ['one-rate__star--filled'] : []),
          ].join(' '),
          'aria-checked': filled ? 'true' : 'false',
          'aria-label': this.props.ariaLabel
            ? `${index} ${this.props.ariaLabel}`
            : String(index),
          disabled: disabled || undefined,
        },
        listeners: {
          click: (event) => this.emitValue(index, event),
        },
        children: ['★'],
      } as VNode);
    }

    return {
      tag: 'div',
      props: {
        role: 'radiogroup',
        className: [
          'one-rate',
          ...(disabled ? ['one-rate--disabled'] : []),
          ...(readonly ? ['one-rate--readonly'] : []),
        ].join(' '),
        'aria-label': this.props.ariaLabel,
      },
      children: stars,
    };
  }

  private getCount(): number {
    const count = this.props.count;
    return typeof count === 'number' && Number.isFinite(count) && count >= 1
      ? Math.floor(count)
      : 5;
  }

  private emitValue(index: number, event: Event): void {
    if (this.props.disabled === true || this.props.readonly === true) return;
    const value = this.getCount();
    const current = Math.min(
      value,
      Math.max(
        0,
        normalizeOneRateValue(this.props.value ?? this.state.internalValue, 0)
      )
    );
    let next = index;
    if (this.props.allowClear === true && index === current) next = 0;
    if (this.props.value === undefined) {
      this.setState({ internalValue: next });
    }
    this.emit('change', {
      value: next,
      originalEvent: event,
    } satisfies OneRateValueEvent);
  }
}
