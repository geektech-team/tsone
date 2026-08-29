import { Component, slot, type VNode } from '@geektech/tsone';
import type { OneNamedStyle } from '../styles/shared';
import type {
  OneFormInitialValues,
  OneFormRules,
  OneFormValidationResult,
  OneFormValues,
} from './context';
import { ONE_FORM_MODEL_KEY } from './context';
import { OneFormModel } from './model';

export interface OneFormProps {
  initialValues?: OneFormInitialValues;
  rules?: OneFormRules;
  children?: Array<VNode | string>;
}

export interface OneFormSubmitEvent {
  values: OneFormValues;
}

interface OneFormState {
  revision: number;
}

export const ONE_FORM_STYLES: OneNamedStyle[] = [
  {
    name: 'one-form-base',
    selector: '.one-form',
    properties: {
      display: 'grid',
      gap: '16px',
    },
  },
];

export class OneForm extends Component<OneFormProps, OneFormState> {
  public readonly model: OneFormModel;

  public constructor(props: OneFormProps = {}) {
    super(props);
    this.model = new OneFormModel(props.initialValues, props.rules);
    this.provide(ONE_FORM_MODEL_KEY, this.model);
  }

  public validate(): OneFormValidationResult {
    return this.model.validate();
  }

  public reset(): void {
    this.model.reset();
  }

  public getValues(): OneFormValues {
    return this.model.getValues();
  }

  protected initState(): OneFormState {
    return { revision: 0 };
  }

  protected initStyles(): void {
    ONE_FORM_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    return {
      tag: 'form',
      props: { className: 'one-form', novalidate: true },
      children: [slot('default')],
      listeners: {
        submit: (event) => this.handleSubmit(event),
        reset: (event) => this.handleReset(event),
      },
    };
  }

  private handleSubmit(event: Event): void {
    event.preventDefault();
    const result = this.model.validate();
    if (!result.valid) {
      this.model.focusFirstInvalidField();
      return;
    }

    this.emit('submit', { values: this.model.getValues() });
  }

  private handleReset(event: Event): void {
    event.preventDefault();
    this.model.reset();
  }
}
