import { Component, type VNode } from '@geektech/tsone';
import { normalizeOneSize, type OneNamedStyle } from '../styles/shared';
import type { OneComponentSize } from '../types';

export interface OneInputValueEvent {
  value: string;
  originalEvent: Event;
}

export interface OneInputProps {
  value?: string;
  defaultValue?: string;
  type?: string;
  name?: string;
  placeholder?: string;
  size?: OneComponentSize;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
}

interface OneInputState {
  internalValue: string;
}

export const ONE_INPUT_STYLES: OneNamedStyle[] = [
  {
    name: 'one-input-base',
    selector: '.one-input',
    properties: {
      boxSizing: 'border-box',
      width: '100%',
      border: '1px solid var(--one-input-border-color, #d1d5db)',
      borderRadius: 'var(--one-radius-md, 0.375rem)',
      color: 'var(--one-input-color, #1f2937)',
      backgroundColor: 'var(--one-input-background, #ffffff)',
      fontFamily: 'inherit',
      lineHeight: 'var(--one-line-height-normal, 1.5)',
      transition: 'var(--one-transition-fast, 150ms ease)',
    },
  },
  {
    name: 'one-input-sm',
    selector: '.one-input--sm',
    properties: {
      minHeight: 'var(--one-input-height-sm, 2rem)',
      padding: 'var(--one-input-padding-sm, 0.25rem 0.5rem)',
      fontSize: 'var(--one-font-size-sm, 0.875rem)',
    },
  },
  {
    name: 'one-input-md',
    selector: '.one-input--md',
    properties: {
      minHeight: 'var(--one-input-height-md, 2.5rem)',
      padding: 'var(--one-input-padding-md, 0.5rem 0.75rem)',
      fontSize: 'var(--one-font-size-md, 1rem)',
    },
  },
  {
    name: 'one-input-lg',
    selector: '.one-input--lg',
    properties: {
      minHeight: 'var(--one-input-height-lg, 3rem)',
      padding: 'var(--one-input-padding-lg, 0.75rem 1rem)',
      fontSize: 'var(--one-font-size-lg, 1.125rem)',
    },
  },
  {
    name: 'one-input-invalid',
    selector: '.one-input--invalid',
    properties: {
      borderColor: 'var(--one-color-danger, #dc2626)',
    },
  },
  {
    name: 'one-input-disabled',
    selector: '.one-input:disabled',
    properties: {
      opacity: 'var(--one-disabled-opacity, 0.5)',
      cursor: 'not-allowed',
      backgroundColor: 'var(--one-input-disabled-background, #f3f4f6)',
    },
  },
  {
    name: 'one-input-focus-visible',
    selector: '.one-input:focus-visible',
    properties: {
      outline: 'var(--one-focus-outline, 2px solid #2563eb)',
      outlineOffset: 'var(--one-focus-outline-offset, 2px)',
      borderColor: 'var(--one-input-focus-border-color, #2563eb)',
    },
  },
];

export class OneInput extends Component<OneInputProps, OneInputState> {
  protected initState(): OneInputState {
    return { internalValue: this.props.defaultValue ?? '' };
  }

  protected initStyles(): void {
    ONE_INPUT_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    const size = normalizeOneSize(this.props.size);
    const classNames = [
      'one-input',
      ...(this.props.invalid ? ['one-input--invalid'] : []),
      `one-input--${size}`,
    ];

    return {
      tag: 'input',
      props: {
        className: classNames.join(' '),
        value: this.props.value ?? this.state.internalValue,
        type: this.props.type,
        name: this.props.name,
        placeholder: this.props.placeholder,
        disabled: this.props.disabled === true,
        readonly: this.props.readonly === true,
        required: this.props.required === true,
        'aria-invalid': this.props.invalid === true ? 'true' : undefined,
        'aria-label': this.props.ariaLabel,
      },
      listeners: {
        input: (event) => this.emitValue('input', event),
        change: (event) => this.emitValue('change', event),
      },
    };
  }

  protected onUpdated(): void {
    const input = this.getElement();
    if (this.props.value !== undefined && input instanceof HTMLInputElement) {
      input.value = this.props.value;
    }
  }

  private emitValue(eventName: 'input' | 'change', event: Event): void {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const nextValue = input.value;
    if (this.props.value === undefined) {
      this.state.internalValue = nextValue;
    }

    this.emit(eventName, { value: nextValue, originalEvent: event });

    if (this.props.value !== undefined) {
      input.value = this.props.value;
    }
  }
}
