import type {
  OneFieldValue,
  OneFormInitialValues,
  OneFormRules,
  OneFormValidationResult,
  OneFormValues,
  OneValidationRule,
} from './context';

type OneFormSubscriber = () => void;

function hasOwn(object: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function cloneFieldValue(
  value: OneFieldValue | undefined
): OneFieldValue | undefined {
  return Array.isArray(value) ? [...value] : value;
}

function cloneValues(values: OneFormValues): Record<string, OneFieldValue | undefined> {
  return Object.fromEntries(
    Object.entries(values).map(([name, value]) => [name, cloneFieldValue(value)])
  );
}

function isRequiredValue(value: OneFieldValue | undefined): boolean {
  return value !== undefined && value !== '' && value !== false &&
    (!Array.isArray(value) || value.length > 0);
}

function getLength(value: OneFieldValue | undefined): number | undefined {
  return typeof value === 'string' || Array.isArray(value)
    ? value.length
    : undefined;
}

function defaultRuleMessage(rule: OneValidationRule): string {
  if (rule.required) {
    return '此字段为必填项';
  }
  if (rule.minLength !== undefined) {
    return `长度不能少于 ${rule.minLength}`;
  }
  if (rule.maxLength !== undefined) {
    return `长度不能超过 ${rule.maxLength}`;
  }
  if (rule.pattern) {
    return '格式不正确';
  }
  return '校验失败';
}

export class OneFormModel {
  private readonly initialValues: Record<string, OneFieldValue | undefined>;
  private readonly rules: Record<string, readonly OneValidationRule[]>;
  private readonly values: Record<string, OneFieldValue | undefined> = {};
  private readonly errors = new Map<string, string[]>();
  private readonly fields = new Map<string, () => void>();
  private readonly subscribers = new Set<OneFormSubscriber>();

  public constructor(
    initialValues: OneFormInitialValues = {},
    rules: OneFormRules = {}
  ) {
    this.initialValues = cloneValues(initialValues);
    this.rules = Object.fromEntries(
      Object.entries(rules).map(([name, fieldRules]) => [
        name,
        fieldRules ? fieldRules.map((rule) => ({ ...rule })) : [],
      ])
    );
  }

  public ensureValue(name: string, fallback: OneFieldValue): void {
    if (hasOwn(this.values, name)) {
      return;
    }

    this.values[name] = cloneFieldValue(
      hasOwn(this.initialValues, name)
        ? this.initialValues[name]
        : fallback
    );
    this.notify();
  }

  public setValue(name: string, value: OneFieldValue): void {
    this.values[name] = cloneFieldValue(value);
    this.notify();
  }

  public getValue(name: string): OneFieldValue | undefined {
    return cloneFieldValue(this.values[name]);
  }

  public getValues(): OneFormValues {
    return cloneValues(
      Object.fromEntries(
        [...this.fields.keys()].map((name) => [name, this.values[name]])
      )
    );
  }

  public getErrors(name: string): readonly string[] {
    return [...(this.errors.get(name) ?? [])];
  }

  public validate(): OneFormValidationResult {
    this.errors.clear();
    const values = this.getValues();

    this.fields.forEach((_, name) => {
      const messages = this.validateField(name, values);
      if (messages.length > 0) {
        this.errors.set(name, messages);
      }
    });

    this.notify();
    return this.getValidationResult();
  }

  public reset(): void {
    this.errors.clear();
    this.fields.forEach((_, name) => {
      if (hasOwn(this.initialValues, name)) {
        this.values[name] = cloneFieldValue(this.initialValues[name]);
      } else {
        delete this.values[name];
      }
    });
    this.notify();
  }

  public subscribe(listener: OneFormSubscriber): () => void {
    this.subscribers.add(listener);
    return () => this.subscribers.delete(listener);
  }

  public registerField(name: string, focus: () => void): () => void {
    if (!hasOwn(this.values, name) && hasOwn(this.initialValues, name)) {
      this.values[name] = cloneFieldValue(this.initialValues[name]);
    }
    this.fields.set(name, focus);
    return () => {
      this.fields.delete(name);
      this.errors.delete(name);
      delete this.values[name];
      this.notify();
    };
  }

  public focusFirstInvalidField(): boolean {
    for (const [name, focus] of this.fields) {
      if (this.errors.has(name)) {
        focus();
        return true;
      }
    }
    return false;
  }

  private validateField(name: string, values: OneFormValues): string[] {
    const value = this.values[name];
    const messages: string[] = [];

    this.rules[name]?.forEach((rule) => {
      if (rule.required && !isRequiredValue(value)) {
        messages.push(rule.message ?? defaultRuleMessage(rule));
      }

      const length = getLength(value);
      if (rule.minLength !== undefined && length !== undefined && length < rule.minLength) {
        messages.push(rule.message ?? defaultRuleMessage(rule));
      }
      if (rule.maxLength !== undefined && length !== undefined && length > rule.maxLength) {
        messages.push(rule.message ?? defaultRuleMessage(rule));
      }
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        messages.push(rule.message ?? defaultRuleMessage(rule));
      }
      if (rule.validator) {
        try {
          const message = rule.validator(cloneFieldValue(value), values);
          if (message) {
            messages.push(message);
          }
        } catch {
          messages.push('校验器执行失败');
        }
      }
    });

    return messages;
  }

  private getValidationResult(): OneFormValidationResult {
    const errors = Object.fromEntries(
      [...this.errors.entries()].map(([name, messages]) => [name, [...messages]])
    );
    return { valid: this.errors.size === 0, errors };
  }

  private notify(): void {
    [...this.subscribers].forEach((listener) => listener());
  }
}
