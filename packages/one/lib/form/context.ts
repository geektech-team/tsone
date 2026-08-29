import type { InjectionKey } from '@geektech/tsone';
import type { OneFormModel } from './model';

export type OneFieldValue = string | boolean | string[];

export type OneFormValues = Readonly<
  Record<string, OneFieldValue | undefined>
>;

export type OneFormInitialValues = Readonly<
  Record<string, OneFieldValue | undefined>
>;

export interface OneFieldValueEvent<TValue extends OneFieldValue> {
  value: TValue;
  originalEvent: Event;
}

export interface OneValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  message?: string;
  validator?: (
    value: OneFieldValue | undefined,
    values: OneFormValues
  ) => string | undefined;
}

export type OneFormRules = Readonly<
  Record<string, readonly OneValidationRule[] | undefined>
>;

export interface OneFormValidationResult {
  valid: boolean;
  errors: Readonly<Record<string, readonly string[]>>;
}

export interface OneFormFieldContext {
  name: string;
  controlId: string;
  describedBy: string | undefined;
  model: OneFormModel;
}

export const ONE_FORM_MODEL_KEY = Symbol(
  'one-form-model'
) as InjectionKey<OneFormModel>;

export const ONE_FORM_FIELD_KEY = Symbol(
  'one-form-field'
) as InjectionKey<OneFormFieldContext>;
