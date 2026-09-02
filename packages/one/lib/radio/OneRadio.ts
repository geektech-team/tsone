import { Component, slot, type VNode } from '@geektech/tsone';
import type { OneFieldValueEvent, OneFormFieldContext } from '../form/context';
import { ONE_FORM_FIELD_KEY } from '../form/context';
import {
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  type OneNamedStyle,
} from '../styles/shared';

export interface OneRadioProps {
  value?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
  children?: Array<VNode | string>;
}

interface OneRadioState {
  internalChecked: boolean;
  revision: number;
}

export const ONE_RADIO_STYLES: OneNamedStyle[] = [
  {
    name: 'one-radio-base',
    selector: '.one-radio',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      display: 'inline-flex',
      gap: '8px',
      alignItems: 'center',
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
    },
  },
  {
    name: 'one-radio-input',
    selector: '.one-radio__input',
    properties: {
      accentColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
  },
  {
    name: 'one-radio-invalid',
    selector: '.one-radio--invalid',
    properties: {
      color: `var(--one-color-danger, ${ONE_THEME_DEFAULTS.colorDanger})`,
    },
  },
  {
    name: 'one-radio-disabled',
    selector: '.one-radio--disabled',
    properties: { opacity: '0.5', cursor: 'not-allowed' },
  },
];

export class OneRadio extends Component<OneRadioProps, OneRadioState> {
  private fieldContext: OneFormFieldContext | undefined;
  private unsubscribe: (() => void) | undefined;

  protected initState(): OneRadioState {
    return { internalChecked: this.props.defaultChecked ?? false, revision: 0 };
  }

  protected initStyles(): void {
    ONE_RADIO_STYLES.forEach(({ name, ...style }) =>
      this.styleManager.addStyle(name, style)
    );
  }

  protected beforeMount(): void {
    this.fieldContext = this.inject(ONE_FORM_FIELD_KEY);
    if (this.props.checked === true || this.props.defaultChecked === true) {
      this.fieldContext?.model.ensureValue(
        this.fieldContext.name,
        this.props.value ?? ''
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
          'one-radio',
          ...(invalid ? ['one-radio--invalid'] : []),
          ...(this.props.disabled ? ['one-radio--disabled'] : []),
        ].join(' '),
      },
      children: [
        {
          tag: 'input',
          props: {
            className: 'one-radio__input',
            type: 'radio',
            value: this.props.value,
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
    if (typeof value === 'string') return value === (this.props.value ?? '');
    return this.props.checked ?? this.state.internalChecked;
  }

  private emitChecked(eventName: 'input' | 'change', event: Event): void {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement) || this.props.disabled) return;
    const value = this.props.value ?? '';
    if (this.fieldContext)
      this.fieldContext.model.setValue(this.fieldContext.name, value);
    else if (this.props.checked === undefined)
      this.state.internalChecked = input.checked;
    this.emit(eventName, {
      value,
      originalEvent: event,
    } satisfies OneFieldValueEvent<string>);
    if (!this.fieldContext && this.props.checked !== undefined)
      input.checked = this.props.checked;
  }
}
