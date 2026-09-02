export type ValidationResult = boolean | string;
export type ValidationRule<T = unknown> = (value: T, model: object) => ValidationResult;
export type ValidationRules<TModel extends object> = {
    [TPath in keyof TModel & string]?: readonly ValidationRule[];
} & Record<string, readonly ValidationRule[] | undefined>;
export interface FieldValidationResult {
    valid: boolean;
    errors: string[];
}
export interface FormValidationResult {
    valid: boolean;
    errors: Record<string, string[]>;
}
export interface FormController<TModel extends object> {
    readonly model: TModel;
    readonly errors: Record<string, string[]>;
    validate(): FormValidationResult;
    validateField(path: string): FieldValidationResult;
    resetErrors(): void;
}
export declare function required(message?: string): ValidationRule;
export declare function minLength(length: number, message?: string): ValidationRule;
export declare function validate(rule: ValidationRule): ValidationRule;
export declare function createForm<TModel extends object>(model: TModel, rules: ValidationRules<TModel>): FormController<TModel>;
