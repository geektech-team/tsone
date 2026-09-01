import { Component, type VNode } from '@geektech/tsone';
import type { OneFieldValueEvent, OneFormFieldContext } from '../form/context';
import { ONE_FORM_FIELD_KEY } from '../form/context';
import {
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  type OneNamedStyle,
} from '../styles/shared';

export interface OneSwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
}
interface OneSwitchState {
  internalChecked: boolean;
  revision: number;
}
export const ONE_SWITCH_STYLES: OneNamedStyle[] = [
  {
    name: 'one-switch-base',
    selector: '.one-switch',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      display: 'inline-flex',
      alignItems: 'center',
      position: 'relative',
      width: '44px',
      height: '24px',
      borderRadius: '999px',
      backgroundColor: `var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
      cursor: 'pointer',
      transition: '150ms ease',
    },
  },
  {
    name: 'one-switch-input',
    selector: '.one-switch__input',
    properties: {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      margin: '0',
      opacity: '0',
      cursor: 'inherit',
    },
  },
  {
    name: 'one-switch-thumb',
    selector: '.one-switch__thumb',
    properties: {
      width: '18px',
      height: '18px',
      marginLeft: '3px',
      borderRadius: '50%',
      backgroundColor: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
      boxShadow: '0 1px 3px rgba(22, 32, 24, 0.28)',
      pointerEvents: 'none',
      transition: '150ms ease',
    },
  },
  {
    name: 'one-switch-thumb-checked',
    selector: '.one-switch--checked .one-switch__thumb',
    properties: { transform: 'translateX(20px)' },
  },
  {
    name: 'one-switch-checked',
    selector: '.one-switch--checked',
    properties: {
      backgroundColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
  },
  {
    name: 'one-switch-invalid',
    selector: '.one-switch--invalid',
    properties: {
      outline: `2px solid var(--one-color-danger, ${ONE_THEME_DEFAULTS.colorDanger})`,
    },
  },
  {
    name: 'one-switch-disabled',
    selector: '.one-switch--disabled',
    properties: { opacity: '0.5', cursor: 'not-allowed' },
  },
  {
    name: 'one-switch-focus-visible',
    selector: '.one-switch:has(.one-switch__input:focus-visible)',
    properties: {
      outline: `2px solid var(--one-color-focus, ${ONE_THEME_DEFAULTS.colorFocus})`,
      outlineOffset: '2px',
    },
  },
];
export class OneSwitch extends Component<OneSwitchProps, OneSwitchState> {
  private fieldContext: OneFormFieldContext | undefined;
  private unsubscribe: (() => void) | undefined;
  protected initState(): OneSwitchState {
    return { internalChecked: this.props.defaultChecked ?? false, revision: 0 };
  }
  protected initStyles(): void {
    ONE_SWITCH_STYLES.forEach(({ name, ...style }) =>
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
          'one-switch',
          ...(checked ? ['one-switch--checked'] : []),
          ...(invalid ? ['one-switch--invalid'] : []),
          ...(this.props.disabled ? ['one-switch--disabled'] : []),
        ].join(' '),
        role: 'switch',
        'aria-checked': checked ? 'true' : 'false',
      },
      children: [
        {
          tag: 'input',
          props: {
            className: 'one-switch__input',
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
        {
          tag: 'span',
          props: { className: 'one-switch__thumb', 'aria-hidden': 'true' },
        },
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
