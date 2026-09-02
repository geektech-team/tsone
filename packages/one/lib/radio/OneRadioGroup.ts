import { Component, type VNode } from '@geektech/tsone';
import type { OneFieldValueEvent, OneFormFieldContext } from '../form/context';
import { ONE_FORM_FIELD_KEY } from '../form/context';
import type { OneSelectOption } from '../select';
import {
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  type OneNamedStyle,
} from '../styles/shared';

export interface OneRadioGroupProps {
  options: readonly OneSelectOption[];
  value?: string;
  defaultValue?: string;
  name?: string;
  disabled?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
}

interface OneRadioGroupState {
  internalValue: string;
  revision: number;
}

export const ONE_RADIO_GROUP_STYLES: OneNamedStyle[] = [
  {
    name: 'one-radio-group-base',
    selector: '.one-radio-group',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      display: 'inline-flex',
      flexDirection: 'column',
      gap: '8px',
    },
  },
  {
    name: 'one-radio-group-option',
    selector: '.one-radio-group__option',
    properties: {
      display: 'inline-flex',
      gap: '8px',
      alignItems: 'center',
    },
  },
  {
    name: 'one-radio-group-input',
    selector: '.one-radio-group__option input',
    properties: {
      accentColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
  },
  {
    name: 'one-radio-group-disabled',
    selector: '.one-radio-group--disabled',
    properties: { opacity: '0.5', cursor: 'not-allowed' },
  },
];

export class OneRadioGroup extends Component<
  OneRadioGroupProps,
  OneRadioGroupState
> {
  private fieldContext: OneFormFieldContext | undefined;
  private unsubscribe: (() => void) | undefined;

  protected initState(): OneRadioGroupState {
    return { internalValue: this.props.defaultValue ?? '', revision: 0 };
  }

  protected initStyles(): void {
    ONE_RADIO_GROUP_STYLES.forEach(({ name, ...style }) =>
      this.styleManager.addStyle(name, style)
    );
  }

  protected beforeMount(): void {
    this.fieldContext = this.inject(ONE_FORM_FIELD_KEY);
    this.fieldContext?.model.ensureValue(
      this.fieldContext.name,
      this.props.value ?? this.props.defaultValue ?? ''
    );
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

  protected render(): VNode {
    void this.state.revision;
    const value = this.getValue();
    const invalid =
      this.props.invalid ||
      (this.fieldContext?.model.getErrors(this.fieldContext.name).length ?? 0) >
        0;
    return {
      tag: 'div',
      props: {
        className: [
          'one-radio-group',
          ...(this.props.disabled ? ['one-radio-group--disabled'] : []),
        ].join(' '),
        role: 'radiogroup',
        'aria-label': this.props.ariaLabel,
        'aria-invalid': invalid ? 'true' : undefined,
        'aria-describedby': this.fieldContext?.describedBy,
      },
      children: this.props.options.map((option) => ({
        tag: 'label',
        props: { className: 'one-radio-group__option' },
        children: [
          {
            tag: 'input',
            props: {
              type: 'radio',
              value: option.value,
              checked: value === option.value,
              disabled: this.props.disabled || option.disabled,
              name: this.fieldContext?.name ?? this.props.name,
            },
            listeners: { change: (event) => this.select(option, event) },
          },
          option.label,
        ],
      })),
    };
  }

  private getValue(): string {
    const value = this.fieldContext?.model.getValue(this.fieldContext.name);
    return typeof value === 'string'
      ? value
      : this.props.value ?? this.state.internalValue;
  }

  private select(option: OneSelectOption, event: Event): void {
    const input = event.currentTarget;
    if (
      !(input instanceof HTMLInputElement) ||
      this.props.disabled ||
      option.disabled
    )
      return;
    if (this.fieldContext)
      this.fieldContext.model.setValue(this.fieldContext.name, option.value);
    else if (this.props.value === undefined)
      this.state.internalValue = option.value;
    this.emit('input', {
      value: option.value,
      originalEvent: event,
    } satisfies OneFieldValueEvent<string>);
    this.emit('change', {
      value: option.value,
      originalEvent: event,
    } satisfies OneFieldValueEvent<string>);
  }
}
