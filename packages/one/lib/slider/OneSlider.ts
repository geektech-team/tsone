import { Component, type VNode } from '@geektech/tsone';
import {
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  type OneNamedStyle,
} from '../styles/shared';

export interface OneSliderValueEvent {
  value: number;
  originalEvent: Event;
}

export interface OneSliderProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  showValue?: boolean;
  ariaLabel?: string;
}

interface OneSliderState {
  internalValue: number;
}

export const ONE_SLIDER_STYLES: OneNamedStyle[] = [
  {
    name: 'one-slider-base',
    selector: '.one-slider',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '12px',
      width: '100%',
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
    },
  },
  {
    name: 'one-slider-input',
    selector: '.one-slider__input',
    properties: {
      flex: '1',
      minWidth: '160px',
      accentColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
  },
  {
    name: 'one-slider-value',
    selector: '.one-slider__value',
    properties: {
      minWidth: '3em',
      textAlign: 'right',
      color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
      fontSize: `var(--one-font-size-sm, ${ONE_THEME_DEFAULTS.fontSizeSm})`,
    },
  },
  {
    name: 'one-slider-disabled',
    selector: '.one-slider--disabled',
    properties: { opacity: '0.5' },
  },
];

export function normalizeOneSliderNumber(
  value: number | undefined,
  fallback: number
): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function clampOneSliderValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export class OneSlider extends Component<OneSliderProps, OneSliderState> {
  protected initState(): OneSliderState {
    return {
      internalValue: normalizeOneSliderNumber(this.props.defaultValue, 0),
    };
  }

  protected initStyles(): void {
    ONE_SLIDER_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    const min = normalizeOneSliderNumber(this.props.min, 0);
    const max = normalizeOneSliderNumber(this.props.max, 100);
    const step = normalizeOneSliderNumber(this.props.step, 1);
    const rawValue = normalizeOneSliderNumber(
      this.props.value ?? this.state.internalValue,
      0
    );
    const value = clampOneSliderValue(rawValue, min, max);
    const disabled = this.props.disabled === true;

    return {
      tag: 'div',
      props: {
        className: [
          'one-slider',
          ...(disabled ? ['one-slider--disabled'] : []),
        ].join(' '),
      },
      children: [
        {
          tag: 'input',
          props: {
            className: 'one-slider__input',
            type: 'range',
            min: String(min),
            max: String(max),
            step: String(step),
            value: String(value),
            disabled,
            'aria-label': this.props.ariaLabel,
            'aria-valuenow': String(value),
            'aria-valuemin': String(min),
            'aria-valuemax': String(max),
          },
          listeners: {
            input: (event) => this.emitValue('input', event),
            change: (event) => this.emitValue('change', event),
          },
        } as VNode,
        ...(this.props.showValue
          ? [
              {
                tag: 'output',
                props: { className: 'one-slider__value' },
                children: [String(value)],
              } as VNode,
            ]
          : []),
      ],
    };
  }

  private emitValue(eventName: 'input' | 'change', event: Event): void {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement) || this.props.disabled) return;
    const min = normalizeOneSliderNumber(this.props.min, 0);
    const max = normalizeOneSliderNumber(this.props.max, 100);
    const value = clampOneSliderValue(
      normalizeOneSliderNumber(Number(input.value), 0),
      min,
      max
    );
    if (this.props.value === undefined) {
      this.setState({ internalValue: value });
    }
    this.emit(eventName, {
      value,
      originalEvent: event,
    } satisfies OneSliderValueEvent);
  }
}
