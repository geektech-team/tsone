import { Component, type VNode } from '@geektech/tsone';
import {
  normalizeOneSize,
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  oneThemeBorder,
  type OneNamedStyle,
} from '../styles/shared';
import type { OneComponentSize } from '../types';
import { ONE_FORM_FIELD_KEY } from '../form/context';
import type { OneFormFieldContext } from '../form/context';

export interface OneTextareaValueEvent {
  value: string;
  originalEvent: Event;
}

export interface OneTextareaProps {
  value?: string;
  defaultValue?: string;
  name?: string;
  placeholder?: string;
  /** 可见行数，1-10，默认 3。 */
  rows?: number;
  size?: OneComponentSize;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
}

interface OneTextareaState {
  internalValue: string;
  revision: number;
}

const ONE_TEXTAREA_DEFAULT_ROWS = 3;
const ONE_TEXTAREA_MAX_ROWS = 10;

export const ONE_TEXTAREA_STYLES: OneNamedStyle[] = [
  {
    name: 'one-textarea-base',
    selector: '.one-textarea',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      boxSizing: 'border-box',
      width: '100%',
      resize: 'vertical',
      border: oneThemeBorder(
        `var(--one-input-border-color, var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder}))`
      ),
      borderRadius: `var(--one-radius-md, ${ONE_THEME_DEFAULTS.radiusMd})`,
      color: `var(--one-input-color, var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText}))`,
      backgroundColor: `var(--one-input-background, var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface}))`,
      transition: '150ms ease',
    },
  },
  {
    name: 'one-textarea-sm',
    selector: '.one-textarea--sm',
    properties: {
      padding: `var(--one-input-padding-sm, ${ONE_THEME_DEFAULTS.spaceXs} ${ONE_THEME_DEFAULTS.spaceSm})`,
      fontSize: `var(--one-font-size-sm, ${ONE_THEME_DEFAULTS.fontSizeSm})`,
    },
  },
  {
    name: 'one-textarea-md',
    selector: '.one-textarea--md',
    properties: {
      padding: `var(--one-input-padding-md, ${ONE_THEME_DEFAULTS.spaceSm} ${ONE_THEME_DEFAULTS.spaceMd})`,
      fontSize: `var(--one-font-size-md, ${ONE_THEME_DEFAULTS.fontSizeMd})`,
    },
  },
  {
    name: 'one-textarea-lg',
    selector: '.one-textarea--lg',
    properties: {
      padding: `var(--one-input-padding-lg, ${ONE_THEME_DEFAULTS.spaceMd} ${ONE_THEME_DEFAULTS.spaceLg})`,
      fontSize: `var(--one-font-size-lg, ${ONE_THEME_DEFAULTS.fontSizeLg})`,
    },
  },
  {
    name: 'one-textarea-invalid',
    selector: '.one-textarea--invalid',
    properties: {
      borderColor: `var(--one-color-danger, ${ONE_THEME_DEFAULTS.colorDanger})`,
    },
  },
  {
    name: 'one-textarea-disabled',
    selector: '.one-textarea:disabled',
    properties: {
      opacity: '0.5',
      cursor: 'not-allowed',
      backgroundColor: `var(--one-input-disabled-background, var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface}))`,
    },
  },
  {
    name: 'one-textarea-focus-visible',
    selector: '.one-textarea:focus-visible',
    properties: {
      outline: `2px solid var(--one-color-focus, ${ONE_THEME_DEFAULTS.colorFocus})`,
      outlineOffset: '2px',
      borderColor: `var(--one-input-focus-border-color, var(--one-color-focus, ${ONE_THEME_DEFAULTS.colorFocus}))`,
    },
  },
];

export function normalizeOneTextareaRows(value: unknown): number {
  const rows = Math.floor(Number(value));
  if (!Number.isFinite(rows) || rows < 1) {
    return ONE_TEXTAREA_DEFAULT_ROWS;
  }
  return Math.min(ONE_TEXTAREA_MAX_ROWS, rows);
}

export class OneTextarea extends Component<OneTextareaProps, OneTextareaState> {
  private fieldContext: OneFormFieldContext | undefined;
  private unsubscribe: (() => void) | undefined;

  protected initState(): OneTextareaState {
    return { internalValue: this.props.defaultValue ?? '', revision: 0 };
  }

  protected initStyles(): void {
    ONE_TEXTAREA_STYLES.forEach(({ name, ...style }) => {
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
      'one-textarea',
      ...(this.props.invalid || fieldErrors.length > 0
        ? ['one-textarea--invalid']
        : []),
      `one-textarea--${size}`,
    ];

    return {
      tag: 'textarea',
      props: {
        className: classNames.join(' '),
        value: typeof value === 'string' ? value : '',
        rows: normalizeOneTextareaRows(this.props.rows),
        name: fieldContext?.name ?? this.props.name,
        id: fieldContext?.controlId,
        placeholder: this.props.placeholder,
        disabled: this.props.disabled === true,
        readonly: this.props.readonly === true,
        required: this.props.required === true,
        'aria-invalid':
          this.props.invalid || fieldErrors.length > 0 ? 'true' : undefined,
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
    const element = this.getElement();
    if (
      !this.fieldContext &&
      this.props.value !== undefined &&
      element instanceof HTMLTextAreaElement
    ) {
      element.value = this.props.value;
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
    const element = event.currentTarget;
    if (!(element instanceof HTMLTextAreaElement)) {
      return;
    }

    const nextValue = element.value;
    if (this.fieldContext) {
      this.fieldContext.model.setValue(this.fieldContext.name, nextValue);
    } else if (this.props.value === undefined) {
      this.state.internalValue = nextValue;
    }

    this.emit(eventName, { value: nextValue, originalEvent: event });

    if (!this.fieldContext && this.props.value !== undefined) {
      element.value = this.props.value;
    }
  }
}
