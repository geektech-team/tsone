import { Component, type VNode } from '@geektech/tsone';
import type { OneFieldValueEvent, OneFormFieldContext } from '../form/context';
import { ONE_FORM_FIELD_KEY } from '../form/context';
import type { OneSelectOption } from '../select';
import {
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  type OneNamedStyle,
} from '../styles/shared';

export interface OneCheckboxGroupProps {
  options: readonly OneSelectOption[];
  value?: string[];
  defaultValue?: string[];
  name?: string;
  disabled?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
}

interface OneCheckboxGroupState {
  internalValue: string[];
  revision: number;
}

export const ONE_CHECKBOX_GROUP_STYLES: OneNamedStyle[] = [
  {
    name: 'one-checkbox-group-base',
    selector: '.one-checkbox-group',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
    },
  },
];

export class OneCheckboxGroup extends Component<
  OneCheckboxGroupProps,
  OneCheckboxGroupState
> {
  private fieldContext: OneFormFieldContext | undefined;
  private unsubscribe: (() => void) | undefined;
  protected initState(): OneCheckboxGroupState {
    return { internalValue: [...(this.props.defaultValue ?? [])], revision: 0 };
  }
  protected initStyles(): void {
    ONE_CHECKBOX_GROUP_STYLES.forEach(({ name, ...style }) =>
      this.styleManager.addStyle(name, style)
    );
  }
  protected beforeMount(): void {
    this.fieldContext = this.inject(ONE_FORM_FIELD_KEY);
    this.fieldContext?.model.ensureValue(
      this.fieldContext.name,
      this.props.value ?? this.props.defaultValue ?? []
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
    const values = this.getValue();
    const invalid =
      this.props.invalid ||
      (this.fieldContext?.model.getErrors(this.fieldContext.name).length ?? 0) >
        0;
    return {
      tag: 'div',
      props: {
        className: 'one-checkbox-group',
        role: 'group',
        'aria-label': this.props.ariaLabel,
        'aria-invalid': invalid ? 'true' : undefined,
        'aria-describedby': this.fieldContext?.describedBy,
      },
      children: this.props.options.map((option) => ({
        tag: 'label',
        props: { className: 'one-checkbox-group__option' },
        children: [
          {
            tag: 'input',
            props: {
              type: 'checkbox',
              checked: values.includes(option.value),
              disabled: this.props.disabled || option.disabled,
              name: this.fieldContext?.name ?? this.props.name,
            },
            listeners: { change: (event) => this.toggle(option, event) },
          },
          option.label,
        ],
      })),
    };
  }
  private getValue(): string[] {
    const value = this.fieldContext?.model.getValue(this.fieldContext.name);
    return Array.isArray(value)
      ? [...value]
      : this.props.value
        ? [...this.props.value]
        : [...this.state.internalValue];
  }
  private toggle(option: OneSelectOption, event: Event): void {
    const input = event.currentTarget;
    if (
      !(input instanceof HTMLInputElement) ||
      this.props.disabled ||
      option.disabled
    )
      return;
    const current = this.getValue();
    const next = input.checked
      ? [...current, option.value]
      : current.filter((value) => value !== option.value);
    const ordered = this.props.options
      .filter((item) => new Set(next).has(item.value))
      .map((item) => item.value);
    if (this.fieldContext)
      this.fieldContext.model.setValue(this.fieldContext.name, ordered);
    else if (this.props.value === undefined) this.state.internalValue = ordered;
    this.emit('input', {
      value: ordered,
      originalEvent: event,
    } satisfies OneFieldValueEvent<string[]>);
    this.emit('change', {
      value: ordered,
      originalEvent: event,
    } satisfies OneFieldValueEvent<string[]>);
  }
}
