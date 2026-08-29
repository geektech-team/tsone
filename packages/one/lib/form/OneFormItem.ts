import { Component, slot, type VNode } from '@geektech/tsone';
import type { OneNamedStyle } from '../styles/shared';
import { ONE_FORM_FIELD_KEY, ONE_FORM_MODEL_KEY } from './context';
import type { OneFormFieldContext } from './context';
import type { OneFormModel } from './model';

export interface OneFormItemProps {
  name: string;
  label?: string;
  description?: string;
  children?: Array<VNode | string>;
}

interface OneFormItemState {
  revision: number;
}

export const ONE_FORM_ITEM_STYLES: OneNamedStyle[] = [
  {
    name: 'one-form-item-base',
    selector: '.one-form-item',
    properties: {
      display: 'grid',
      gap: '6px',
    },
  },
  {
    name: 'one-form-item-label',
    selector: '.one-form-item__label',
    properties: { fontWeight: '500' },
  },
  {
    name: 'one-form-item-description',
    selector: '.one-form-item__description',
    properties: { color: 'var(--one-color-muted, #647268)', fontSize: '12px' },
  },
  {
    name: 'one-form-item-error',
    selector: '.one-form-item__error',
    properties: { color: 'var(--one-color-danger, #b83232)', fontSize: '12px' },
  },
];

function normalizeName(name: string): string {
  return name.trim().replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'field';
}

export class OneFormItem extends Component<OneFormItemProps, OneFormItemState> {
  private model: OneFormModel | undefined;
  private unsubscribe: (() => void) | undefined;
  private unregister: (() => void) | undefined;

  protected initState(): OneFormItemState {
    return { revision: 0 };
  }

  protected initStyles(): void {
    ONE_FORM_ITEM_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected beforeMount(): void {
    const model = this.inject(ONE_FORM_MODEL_KEY);
    if (!model) {
      throw new Error('OneFormItem requires OneForm');
    }

    this.model = model;
    this.provide(ONE_FORM_FIELD_KEY, this.getFieldContext(model));
    this.unregister = model.registerField(this.props.name, () => {
      const element = this.getElement();
      if (!(element instanceof HTMLElement)) {
        return;
      }
      element.querySelector<HTMLElement>('input, button')?.focus();
    });
  }

  protected onMounted(): void {
    this.unsubscribe = this.model?.subscribe(() => {
      this.state.revision += 1;
    });
  }

  protected onUnmounted(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.unregister?.();
    this.unregister = undefined;
    this.model = undefined;
  }

  protected render(): VNode {
    void this.state.revision;
    const model = this.model;
    const ids = this.getIds();
    const errors = model?.getErrors(this.props.name) ?? [];

    return {
      tag: 'div',
      props: { className: 'one-form-item' },
      children: [
        ...(this.props.label
          ? [
              {
                tag: 'label',
                props: { className: 'one-form-item__label', for: ids.control },
                children: [this.props.label],
              } as VNode,
            ]
          : []),
        slot('default'),
        ...(this.props.description
          ? [
              {
                tag: 'div',
                props: {
                  id: ids.description,
                  className: 'one-form-item__description',
                },
                children: [this.props.description],
              } as VNode,
            ]
          : []),
        ...(errors.length > 0
          ? [
              {
                tag: 'div',
                props: {
                  id: ids.error,
                  className: 'one-form-item__error',
                  role: 'alert',
                },
                children: [errors.join(' ')],
              } as VNode,
            ]
          : []),
      ],
    };
  }

  private getFieldContext(model: OneFormModel): OneFormFieldContext {
    const ids = this.getIds();
    return {
      name: this.props.name,
      controlId: ids.control,
      describedBy: this.props.description
        ? `${ids.description} ${ids.error}`
        : ids.error,
      model,
    };
  }

  private getIds(): { control: string; description: string; error: string } {
    const name = normalizeName(this.props.name);
    return {
      control: `one-form-${name}-control`,
      description: `one-form-${name}-description`,
      error: `one-form-${name}-error`,
    };
  }
}
