import { Component, type VNode } from '@geektech/tsone';
import {
  normalizeOneSize,
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  oneThemeBorder,
  type OneNamedStyle,
} from '../styles/shared';
import { bindOneFloatingPanel } from '../dropdown';
import type { OneComponentSize } from '../types';
import { ONE_FORM_FIELD_KEY } from '../form/context';
import type { OneFormFieldContext } from '../form/context';

export interface OneTimePickerValueEvent {
  value: string;
  originalEvent: Event;
}

export interface OneTimePickerProps {
  value?: string;
  defaultValue?: string;
  name?: string;
  placeholder?: string;
  step?: number;
  min?: string;
  max?: string;
  size?: OneComponentSize;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
}

interface OneTimePickerState {
  internalValue: string;
  open: boolean;
  revision: number;
}

interface TimeParts {
  hour: number;
  minute: number;
  second: number;
}

type TimeColumn = 'hour' | 'minute' | 'second';

export const ONE_TIME_PICKER_STYLES: OneNamedStyle[] = [
  {
    name: 'one-time-picker-base',
    selector: '.one-time-picker',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      position: 'relative',
      width: '100%',
    },
  },
  {
    name: 'one-time-picker-input',
    selector: '.one-time-picker__input',
    properties: {
      boxSizing: 'border-box',
      width: '100%',
      border: oneThemeBorder(
        `var(--one-input-border-color, var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder}))`
      ),
      borderRadius: `var(--one-radius-md, ${ONE_THEME_DEFAULTS.radiusMd})`,
      color: `var(--one-input-color, var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText}))`,
      backgroundColor: `var(--one-input-background, var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface}))`,
      cursor: 'pointer',
      transition: '150ms ease',
    },
  },
  {
    name: 'one-time-picker-input-sm',
    selector: '.one-time-picker__input--sm',
    properties: {
      minHeight: '32px',
      padding: `var(--one-input-padding-sm, ${ONE_THEME_DEFAULTS.spaceXs} ${ONE_THEME_DEFAULTS.spaceSm})`,
      fontSize: `var(--one-font-size-sm, ${ONE_THEME_DEFAULTS.fontSizeSm})`,
    },
  },
  {
    name: 'one-time-picker-input-md',
    selector: '.one-time-picker__input--md',
    properties: {
      minHeight: '40px',
      padding: `var(--one-input-padding-md, ${ONE_THEME_DEFAULTS.spaceSm} ${ONE_THEME_DEFAULTS.spaceMd})`,
      fontSize: `var(--one-font-size-md, ${ONE_THEME_DEFAULTS.fontSizeMd})`,
    },
  },
  {
    name: 'one-time-picker-input-lg',
    selector: '.one-time-picker__input--lg',
    properties: {
      minHeight: '48px',
      padding: `var(--one-input-padding-lg, ${ONE_THEME_DEFAULTS.spaceMd} ${ONE_THEME_DEFAULTS.spaceLg})`,
      fontSize: `var(--one-font-size-lg, ${ONE_THEME_DEFAULTS.fontSizeLg})`,
    },
  },
  {
    name: 'one-time-picker-input-invalid',
    selector: '.one-time-picker__input--invalid',
    properties: {
      borderColor: `var(--one-color-danger, ${ONE_THEME_DEFAULTS.colorDanger})`,
    },
  },
  {
    name: 'one-time-picker-input-disabled',
    selector: '.one-time-picker__input:disabled',
    properties: {
      opacity: '0.5',
      cursor: 'not-allowed',
    },
  },
  {
    name: 'one-time-picker-input-focus-visible',
    selector: '.one-time-picker__input:focus-visible',
    properties: {
      outline: `2px solid var(--one-color-focus, ${ONE_THEME_DEFAULTS.colorFocus})`,
      outlineOffset: '2px',
      borderColor: `var(--one-input-focus-border-color, var(--one-color-focus, ${ONE_THEME_DEFAULTS.colorFocus}))`,
    },
  },
  {
    name: 'one-time-picker-panel',
    selector: '.one-time-picker__panel',
    properties: {
      position: 'fixed',
      zIndex: '1000',
      display: 'flex',
      gap: '8px',
      padding: '8px',
      border: oneThemeBorder(),
      borderRadius: `var(--one-radius-md, ${ONE_THEME_DEFAULTS.radiusMd})`,
      backgroundColor: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
      boxShadow: `var(--one-shadow-card, ${ONE_THEME_DEFAULTS.shadowCard})`,
    },
  },
  {
    name: 'one-time-picker-column',
    selector: '.one-time-picker__column',
    properties: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      maxHeight: '240px',
      overflowY: 'auto',
    },
  },
  {
    name: 'one-time-picker-column-label',
    selector: '.one-time-picker__column-label',
    properties: {
      padding: '2px 8px',
      fontSize: `var(--one-font-size-sm, ${ONE_THEME_DEFAULTS.fontSizeSm})`,
      color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
    },
  },
  {
    name: 'one-time-picker-option',
    selector: '.one-time-picker__option',
    properties: {
      padding: '4px 8px',
      border: '0',
      borderRadius: `var(--one-radius-sm, ${ONE_THEME_DEFAULTS.radiusSm})`,
      backgroundColor: 'transparent',
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
      cursor: 'pointer',
      textAlign: 'center',
    },
  },
  {
    name: 'one-time-picker-option-selected',
    selector: '.one-time-picker__option--selected',
    properties: {
      backgroundColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
    },
  },
];

function normalizeStep(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 60;
}

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

function parseTime(value: string): TimeParts | null {
  const match = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = match[3] === undefined ? 0 : Number(match[3]);
  if (hour > 23 || minute > 59 || second > 59) {
    return null;
  }
  return { hour, minute, second };
}

function formatTime(parts: TimeParts, includeSeconds: boolean): string {
  return includeSeconds
    ? `${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}`
    : `${pad(parts.hour)}:${pad(parts.minute)}`;
}

export class OneTimePicker extends Component<
  OneTimePickerProps,
  OneTimePickerState
> {
  private fieldContext: OneFormFieldContext | undefined;
  private unsubscribe: (() => void) | undefined;
  private floatingCleanup: (() => void) | undefined;

  protected initState(): OneTimePickerState {
    return {
      internalValue: this.props.defaultValue ?? '',
      open: false,
      revision: 0,
    };
  }

  protected initStyles(): void {
    ONE_TIME_PICKER_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    void this.state.revision;
    const size = normalizeOneSize(this.props.size);
    const step = normalizeStep(this.props.step);
    const includeSeconds = step < 60;
    const minuteIncrement = includeSeconds ? 1 : Math.max(1, Math.floor(step / 60));
    const fieldContext = this.fieldContext;
    const fieldErrors = fieldContext?.model.getErrors(fieldContext.name) ?? [];
    const invalid = this.props.invalid || fieldErrors.length > 0;
    const text = this.getDisplayValue();
    const parts = parseTime(text);
    const disabled = this.props.disabled === true;
    const readonly = this.props.readonly === true;

    const minParts = this.props.min ? parseTime(this.props.min) : undefined;
    const maxParts = this.props.max ? parseTime(this.props.max) : undefined;
    const startHour = minParts?.hour ?? 0;
    const endHour = maxParts?.hour ?? 23;

    const minuteStart =
      minParts && parts?.hour === minParts.hour ? minParts.minute : 0;
    const minuteEnd =
      maxParts && parts?.hour === maxParts.hour ? maxParts.minute : 59;
    const secondStart =
      minParts &&
      parts?.hour === minParts.hour &&
      parts?.minute === minParts.minute
        ? minParts.second
        : 0;
    const secondEnd =
      maxParts &&
      parts?.hour === maxParts.hour &&
      parts?.minute === maxParts.minute
        ? maxParts.second
        : 59;

    const inputClassNames = [
      'one-time-picker__input',
      ...(invalid ? ['one-time-picker__input--invalid'] : []),
      `one-time-picker__input--${size}`,
    ];

    return {
      tag: 'div',
      props: { className: 'one-time-picker' },
      children: [
        {
          tag: 'input',
          props: {
            className: inputClassNames.join(' '),
            type: 'text',
            value: text,
            name: fieldContext?.name ?? this.props.name,
            id: fieldContext?.controlId,
            placeholder: this.props.placeholder ?? '请选择时间',
            disabled,
            readonly,
            required: this.props.required === true,
            'aria-invalid': invalid ? 'true' : undefined,
            'aria-expanded': this.state.open ? 'true' : 'false',
            'aria-haspopup': 'dialog',
            'aria-describedby': fieldContext?.describedBy,
            'aria-label': this.props.ariaLabel,
          },
          listeners: {
            click: () => {
              if (!disabled && !readonly) {
                this.state.open = !this.state.open;
              }
            },
            keydown: (event) => this.handleKeydown(event),
            input: (event) => this.emitValue('input', event),
            change: (event) => this.emitValue('change', event),
          },
        },
        ...(this.state.open
          ? [
              {
                tag: 'div',
                props: {
                  className: 'one-time-picker__panel',
                  role: 'dialog',
                  'aria-label': '选择时间',
                },
                children: [
                  this.buildColumn(
                    '时',
                    this.rangeValues(startHour, endHour, 1),
                    parts?.hour,
                    'hour',
                    false
                  ),
                  this.buildColumn(
                    '分',
                    this.rangeValues(minuteStart, minuteEnd, minuteIncrement),
                    parts?.minute,
                    'minute',
                    !includeSeconds
                  ),
                  ...(includeSeconds
                    ? [
                        this.buildColumn(
                          '秒',
                          this.rangeValues(secondStart, secondEnd, step),
                          parts?.second,
                          'second',
                          true
                        ),
                      ]
                    : []),
                ],
              } as VNode,
            ]
          : []),
      ],
    };
  }

  protected onUpdated(): void {
    const root = this.getElement();
    const input =
      root instanceof HTMLInputElement
        ? root
        : root instanceof HTMLElement
          ? root.querySelector('input')
          : null;
    if (
      input instanceof HTMLInputElement &&
      !this.fieldContext &&
      this.props.value !== undefined
    ) {
      input.value = this.props.value;
    }
    this.floatingCleanup?.();
    this.floatingCleanup = undefined;
    if (!this.state.open || !(root instanceof HTMLElement)) return;
    const trigger = root.querySelector<HTMLElement>('.one-time-picker__input');
    const panel = root.querySelector<HTMLElement>('.one-time-picker__panel');
    if (!trigger || !panel) return;
    this.floatingCleanup = bindOneFloatingPanel({
      trigger,
      panel,
      onOutside: () => {
        this.state.open = false;
      },
    });
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
    this.floatingCleanup?.();
    this.floatingCleanup = undefined;
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.fieldContext = undefined;
  }

  private getDisplayValue(): string {
    const value = this.fieldContext
      ? this.fieldContext.model.getValue(this.fieldContext.name)
      : this.props.value ?? this.state.internalValue;
    return typeof value === 'string' ? value : '';
  }

  private rangeValues(start: number, end: number, increment: number): number[] {
    const values: number[] = [];
    for (let value = start; value <= end; value += increment) {
      values.push(value);
    }
    return values;
  }

  private buildColumn(
    label: string,
    values: number[],
    selectedValue: number | undefined,
    part: TimeColumn,
    isLast: boolean
  ): VNode {
    return {
      tag: 'div',
      props: { className: 'one-time-picker__column' },
      children: [
        {
          tag: 'div',
          props: { className: 'one-time-picker__column-label' },
          children: [label],
        },
        ...values.map(
          (value) =>
            ({
              tag: 'button',
              props: {
                type: 'button',
                className: [
                  'one-time-picker__option',
                  ...(selectedValue === value
                    ? ['one-time-picker__option--selected']
                    : []),
                ].join(' '),
              },
              children: [pad(value)],
              listeners: {
                click: (event) =>
                  this.commitPart(part, value, isLast, event),
              },
            }) as VNode
        ),
      ],
    };
  }

  private commitPart(
    part: TimeColumn,
    value: number,
    isLast: boolean,
    event: Event
  ): void {
    const current = parseTime(this.getDisplayValue()) ?? {
      hour: 0,
      minute: 0,
      second: 0,
    };
    const next: TimeParts = { ...current };
    if (part === 'hour') {
      next.hour = value;
    } else if (part === 'minute') {
      next.minute = value;
    } else {
      next.second = value;
    }
    const formatted = formatTime(next, normalizeStep(this.props.step) < 60);
    this.writeValue(formatted, event);
    if (isLast) {
      this.state.open = false;
    }
  }

  private writeValue(value: string, event: Event): void {
    if (this.fieldContext) {
      this.fieldContext.model.setValue(this.fieldContext.name, value);
    } else if (this.props.value === undefined) {
      this.state.internalValue = value;
    }
    this.emit('input', {
      value,
      originalEvent: event,
    } satisfies OneTimePickerValueEvent);
    this.emit('change', {
      value,
      originalEvent: event,
    } satisfies OneTimePickerValueEvent);
  }

  private handleKeydown(event: Event): void {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }
    if (event.key === 'Escape') {
      this.state.open = false;
    }
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
