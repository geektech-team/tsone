import { Component, type VNode } from '@geektech/tsone';
import {
  normalizeOneSize,
  ONE_THEME_DEFAULTS,
  type OneNamedStyle,
} from '../styles/shared';
import type { OneComponentSize } from '../types';
import { ONE_FORM_FIELD_KEY } from '../form/context';
import type { OneFormFieldContext } from '../form/context';

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
  revision: number;
}

export const ONE_INPUT_STYLES: OneNamedStyle[] = [
  {
    name: 'one-input-base',
    selector: '.one-input',
    properties: {
      boxSizing: 'border-box',
      width: '100%',
      border: `1px solid var(--one-input-border-color, var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder}))`,
      borderRadius: `var(--one-radius-md, ${ONE_THEME_DEFAULTS.radiusMd})`,
      color: `var(--one-input-color, var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText}))`,
      backgroundColor: `var(--one-input-background, var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface}))`,
      fontFamily: `var(--one-font-family, ${ONE_THEME_DEFAULTS.fontFamily})`,
      lineHeight: '1.5',
      transition: '150ms ease',
    },
  },
  {
    name: 'one-input-sm',
    selector: '.one-input--sm',
    properties: {
      minHeight: '32px',
      padding: `var(--one-input-padding-sm, ${ONE_THEME_DEFAULTS.spaceXs} ${ONE_THEME_DEFAULTS.spaceSm})`,
      fontSize: `var(--one-font-size-sm, ${ONE_THEME_DEFAULTS.fontSizeSm})`,
    },
  },
  {
    name: 'one-input-md',
    selector: '.one-input--md',
    properties: {
      minHeight: '40px',
      padding: `var(--one-input-padding-md, ${ONE_THEME_DEFAULTS.spaceSm} ${ONE_THEME_DEFAULTS.spaceMd})`,
      fontSize: `var(--one-font-size-md, ${ONE_THEME_DEFAULTS.fontSizeMd})`,
    },
  },
  {
    name: 'one-input-lg',
    selector: '.one-input--lg',
    properties: {
      minHeight: '48px',
      padding: `var(--one-input-padding-lg, ${ONE_THEME_DEFAULTS.spaceMd} ${ONE_THEME_DEFAULTS.spaceLg})`,
      fontSize: `var(--one-font-size-lg, ${ONE_THEME_DEFAULTS.fontSizeLg})`,
    },
  },
  {
    name: 'one-input-invalid',
    selector: '.one-input--invalid',
    properties: {
      borderColor: `var(--one-color-danger, ${ONE_THEME_DEFAULTS.colorDanger})`,
    },
  },
  {
    name: 'one-input-disabled',
    selector: '.one-input:disabled',
    properties: {
      opacity: '0.5',
      cursor: 'not-allowed',
      backgroundColor: `var(--one-input-disabled-background, var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface}))`,
    },
  },
  {
    name: 'one-input-focus-visible',
    selector: '.one-input:focus-visible',
    properties: {
      outline: `2px solid var(--one-color-focus, ${ONE_THEME_DEFAULTS.colorFocus})`,
      outlineOffset: '2px',
      borderColor: `var(--one-input-focus-border-color, var(--one-color-focus, ${ONE_THEME_DEFAULTS.colorFocus}))`,
    },
  },
];

export class OneInput extends Component<OneInputProps, OneInputState> {
  private fieldContext: OneFormFieldContext | undefined;
  private unsubscribe: (() => void) | undefined;

  protected initState(): OneInputState {
    return { internalValue: this.props.defaultValue ?? '', revision: 0 };
  }

  protected initStyles(): void {
    ONE_INPUT_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    void this.state.revision;
    const size = normalizeOneSize(this.props.size);
    const fieldContext = this.fieldContext;
    const fieldErrors = fieldContext?.model.getErrors(fieldContext.name) ?? [];
    const value = fieldContext
      ? fieldContext.model.getValue(fieldContext.name)
      : this.props.value ?? this.state.internalValue;
    const classNames = [
      'one-input',
      ...(this.props.invalid || fieldErrors.length > 0 ? ['one-input--invalid'] : []),
      `one-input--${size}`,
    ];

    return {
      tag: 'input',
      props: {
        className: classNames.join(' '),
        value: typeof value === 'string' ? value : '',
        type: this.props.type,
        name: fieldContext?.name ?? this.props.name,
        id: fieldContext?.controlId,
        placeholder: this.props.placeholder,
        disabled: this.props.disabled === true,
        readonly: this.props.readonly === true,
        required: this.props.required === true,
        'aria-invalid': this.props.invalid || fieldErrors.length > 0 ? 'true' : undefined,
        'aria-describedby': fieldContext?.describedBy,
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
    if (!this.fieldContext && this.props.value !== undefined && input instanceof HTMLInputElement) {
      input.value = this.props.value;
    }
  }

  protected beforeMount(): void {
    this.fieldContext = this.inject(ONE_FORM_FIELD_KEY);
    if (this.fieldContext) {
      this.fieldContext.model.ensureValue(
        this.fieldContext.name,
        this.props.value ?? this.props.defaultValue ?? ''
      );
    }
  }

  protected onMounted(): void {
    this.unsubscribe = this.fieldContext?.model.subscribe(() => {
      this.state.revision += 1;
    });
  }

  protected onUnmounted(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.fieldContext = undefined;
  }

  private emitValue(eventName: 'input' | 'change', event: Event): void {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const nextValue = input.value;
    if (this.fieldContext) {
      this.fieldContext.model.setValue(this.fieldContext.name, nextValue);
    } else if (this.props.value === undefined) {
      this.state.internalValue = nextValue;
    }

    this.emit(eventName, { value: nextValue, originalEvent: event });

    if (!this.fieldContext && this.props.value !== undefined) {
      input.value = this.props.value;
    }
  }
}
