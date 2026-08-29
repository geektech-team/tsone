import { Component, slot, type VNode } from '@geektech/tsone';
import type { OneFieldValueEvent, OneFormFieldContext } from '../form/context';
import { ONE_FORM_FIELD_KEY } from '../form/context';
import { ONE_THEME_DEFAULTS, type OneNamedStyle } from '../styles/shared';

export interface OneCheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
  children?: Array<VNode | string>;
}

interface OneCheckboxState {
  internalChecked: boolean;
  revision: number;
}

export const ONE_CHECKBOX_STYLES: OneNamedStyle[] = [
  {
    name: 'one-checkbox-base',
    selector: '.one-checkbox',
    properties: {
      display: 'inline-flex',
      gap: '8px',
      alignItems: 'center',
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
    },
  },
  {
    name: 'one-checkbox-input',
    selector: '.one-checkbox__input',
    properties: {
      accentColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
  },
  {
    name: 'one-checkbox-invalid',
    selector: '.one-checkbox--invalid',
    properties: {
      color: `var(--one-color-danger, ${ONE_THEME_DEFAULTS.colorDanger})`,
    },
  },
  {
    name: 'one-checkbox-disabled',
    selector: '.one-checkbox--disabled',
    properties: { opacity: '0.5', cursor: 'not-allowed' },
  },
];

export class OneCheckbox extends Component<OneCheckboxProps, OneCheckboxState> {
  private fieldContext: OneFormFieldContext | undefined;
  private unsubscribe: (() => void) | undefined;

  protected initState(): OneCheckboxState {
    return { internalChecked: this.props.defaultChecked ?? false, revision: 0 };
  }

  protected initStyles(): void {
    ONE_CHECKBOX_STYLES.forEach(({ name, ...style }) =>
      this.styleManager.addStyle(name, style)
    );
  }

  protected beforeMount(): void {
    this.fieldContext = this.inject(ONE_FORM_FIELD_KEY);
    this.fieldContext?.model.ensureValue(
      this.fieldContext.name,
      this.props.checked ?? this.props.defaultChecked ?? false
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

  protected onUpdated(): void {
    const element = this.getElement();
    const input =
      element instanceof HTMLElement ? element.querySelector('input') : null;
    if (input instanceof HTMLInputElement) input.checked = this.getChecked();
  }

  protected render(): VNode {
    void this.state.revision;
    const checked = this.getChecked();
    const invalid =
      this.props.invalid ||
      (this.fieldContext?.model.getErrors(this.fieldContext.name).length ?? 0) >
        0;
    return {
      tag: 'label',
      props: {
        className: [
          'one-checkbox',
          ...(invalid ? ['one-checkbox--invalid'] : []),
          ...(this.props.disabled ? ['one-checkbox--disabled'] : []),
        ].join(' '),
      },
      children: [
        {
          tag: 'input',
          props: {
            className: 'one-checkbox__input',
            type: 'checkbox',
            checked,
            name: this.fieldContext?.name ?? this.props.name,
            disabled: this.props.disabled === true,
            required: this.props.required === true,
            id: this.fieldContext?.controlId,
            'aria-label': this.props.ariaLabel,
            'aria-invalid': invalid ? 'true' : undefined,
            'aria-describedby': this.fieldContext?.describedBy,
          },
          listeners: {
            input: (event) => this.emitChecked('input', event),
            change: (event) => this.emitChecked('change', event),
          },
        },
        slot('default'),
      ],
    };
  }

  private getChecked(): boolean {
    const value = this.fieldContext?.model.getValue(this.fieldContext.name);
    return typeof value === 'boolean'
      ? value
      : (this.props.checked ?? this.state.internalChecked);
  }

  private emitChecked(eventName: 'input' | 'change', event: Event): void {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement) || this.props.disabled) return;
    const value = input.checked;
    if (this.fieldContext)
      this.fieldContext.model.setValue(this.fieldContext.name, value);
    else if (this.props.checked === undefined)
      this.state.internalChecked = value;
    this.emit(eventName, {
      value,
      originalEvent: event,
    } satisfies OneFieldValueEvent<boolean>);
    if (!this.fieldContext && this.props.checked !== undefined)
      input.checked = this.props.checked;
  }
}
