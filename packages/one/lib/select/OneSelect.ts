import { Component, type VNode } from '@geektech/tsone';
import type { OneFieldValueEvent, OneFormFieldContext } from '../form/context';
import { ONE_FORM_FIELD_KEY } from '../form/context';
import { ONE_THEME_DEFAULTS, type OneNamedStyle } from '../styles/shared';

export interface OneSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
export interface OneSelectOptionGroup {
  label: string;
  options: readonly OneSelectOption[];
}
export interface OneSelectProps {
  options: readonly (OneSelectOption | OneSelectOptionGroup)[];
  value?: string | string[];
  defaultValue?: string | string[];
  multiple?: boolean;
  searchable?: boolean;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
}
interface FlatOption extends OneSelectOption {
  group?: string;
}
interface OneSelectState {
  open: boolean;
  query: string;
  activeIndex: number;
  internalValue: string | string[];
  revision: number;
}
export const ONE_SELECT_STYLES: OneNamedStyle[] = [
  {
    name: 'one-select-base',
    selector: '.one-select',
    properties: { position: 'relative', width: '100%' },
  },
  {
    name: 'one-select-trigger',
    selector: '.one-select__trigger',
    properties: {
      width: '100%',
      minHeight: '40px',
      textAlign: 'left',
      border: `1px solid var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
      borderRadius: `var(--one-radius-md, ${ONE_THEME_DEFAULTS.radiusMd})`,
      backgroundColor: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
    },
  },
  {
    name: 'one-select-menu',
    selector: '.one-select__menu',
    properties: {
      position: 'absolute',
      zIndex: '1',
      width: '100%',
      marginTop: '4px',
      padding: '4px',
      border: `1px solid var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
      borderRadius: `var(--one-radius-md, ${ONE_THEME_DEFAULTS.radiusMd})`,
      backgroundColor: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
    },
  },
  {
    name: 'one-select-option',
    selector: '.one-select__option',
    properties: {
      display: 'block',
      width: '100%',
      padding: '8px',
      textAlign: 'left',
      backgroundColor: 'transparent',
      border: '0',
    },
  },
  {
    name: 'one-select-option-selected',
    selector: '.one-select__option--selected',
    properties: {
      color: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
  },
  {
    name: 'one-select-option-disabled',
    selector: '.one-select__option--disabled',
    properties: { opacity: '0.5', cursor: 'not-allowed' },
  },
];
function isGroup(
  option: OneSelectOption | OneSelectOptionGroup
): option is OneSelectOptionGroup {
  return 'options' in option;
}
function flattenOptions(
  options: readonly (OneSelectOption | OneSelectOptionGroup)[]
): FlatOption[] {
  return options.flatMap((option) =>
    isGroup(option)
      ? option.options.map((item) => ({ ...item, group: option.label }))
      : [option]
  );
}
function normalizeSelectValue(
  value: unknown,
  multiple: boolean
): string | string[] {
  if (multiple)
    return Array.isArray(value) &&
      value.every((item) => typeof item === 'string')
      ? [...value]
      : [];
  return typeof value === 'string' ? value : '';
}
function matchesSearch(option: FlatOption, query: string): boolean {
  return option.label.toLowerCase().includes(query.trim().toLowerCase());
}
export class OneSelect extends Component<OneSelectProps, OneSelectState> {
  private fieldContext: OneFormFieldContext | undefined;
  private unsubscribe: (() => void) | undefined;
  protected initState(): OneSelectState {
    return {
      open: false,
      query: '',
      activeIndex: 0,
      internalValue: normalizeSelectValue(
        this.props.defaultValue,
        this.props.multiple === true
      ),
      revision: 0,
    };
  }
  protected initStyles(): void {
    ONE_SELECT_STYLES.forEach(({ name, ...style }) =>
      this.styleManager.addStyle(name, style)
    );
  }
  protected beforeMount(): void {
    this.fieldContext = this.inject(ONE_FORM_FIELD_KEY);
    this.fieldContext?.model.ensureValue(
      this.fieldContext.name,
      normalizeSelectValue(
        this.props.value ?? this.props.defaultValue,
        this.props.multiple === true
      )
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
    const multiple = this.props.multiple === true;
    const values = this.getValue();
    const selected = new Set(
      Array.isArray(values) ? values : values ? [values] : []
    );
    const all = flattenOptions(this.props.options);
    const visible = all.filter((option) =>
      matchesSearch(option, this.state.query)
    );
    const invalid =
      this.props.invalid ||
      (this.fieldContext?.model.getErrors(this.fieldContext.name).length ?? 0) >
        0;
    const labels = all
      .filter((option) => selected.has(option.value))
      .map((option) => option.label);
    return {
      tag: 'div',
      props: { className: 'one-select' },
      children: [
        {
          tag: 'button',
          props: {
            type: 'button',
            className: 'one-select__trigger',
            role: 'combobox',
            disabled: this.props.disabled === true,
            id: this.fieldContext?.controlId,
            name: this.fieldContext?.name ?? this.props.name,
            'aria-label': this.props.ariaLabel,
            'aria-expanded': this.state.open ? 'true' : 'false',
            'aria-controls': 'one-select-listbox',
            'aria-invalid': invalid ? 'true' : undefined,
            'aria-describedby': this.fieldContext?.describedBy,
          },
          children: [labels.join(', ') || this.props.placeholder || '请选择'],
          listeners: {
            click: () => {
              if (!this.props.disabled) this.state.open = !this.state.open;
            },
            keydown: (event) => this.handleKeydown(event, visible),
          },
        },
        ...(this.state.open
          ? [
              {
                tag: 'div',
                props: {
                  className: 'one-select__menu',
                  id: 'one-select-listbox',
                  role: 'listbox',
                  'aria-multiselectable': multiple ? 'true' : undefined,
                },
                children: [
                  ...(this.props.searchable
                    ? [
                        {
                          tag: 'input',
                          props: {
                            type: 'search',
                            value: this.state.query,
                            'aria-label': '搜索选项',
                          },
                          listeners: {
                            input: (event) => {
                              const input = event.currentTarget;
                              if (input instanceof HTMLInputElement)
                                this.state.query = input.value;
                            },
                          },
                        } as VNode,
                      ]
                    : []),
                  ...visible.flatMap((option, index) => [
                    ...(option.group &&
                    (index === 0 || visible[index - 1].group !== option.group)
                      ? [
                          {
                            tag: 'div',
                            props: { className: 'one-select__group' },
                            children: [option.group],
                          } as VNode,
                        ]
                      : []),
                    {
                      tag: 'button',
                      props: {
                        type: 'button',
                        className: [
                          'one-select__option',
                          ...(selected.has(option.value)
                            ? ['one-select__option--selected']
                            : []),
                          ...(option.disabled
                            ? ['one-select__option--disabled']
                            : []),
                        ].join(' '),
                        role: 'option',
                        disabled: option.disabled === true,
                        'aria-selected': selected.has(option.value)
                          ? 'true'
                          : 'false',
                      },
                      children: [option.label],
                      listeners: {
                        click: (event) => this.selectOption(option, event),
                      },
                    } as VNode,
                  ]),
                ],
              } as VNode,
            ]
          : []),
      ],
    };
  }
  private getValue(): string | string[] {
    const value = this.fieldContext?.model.getValue(this.fieldContext.name);
    return value !== undefined
      ? normalizeSelectValue(value, this.props.multiple === true)
      : normalizeSelectValue(
          this.props.value ?? this.state.internalValue,
          this.props.multiple === true
        );
  }
  private selectOption(option: FlatOption, event: Event): void {
    if (option.disabled) return;
    const multiple = this.props.multiple === true;
    const current = this.getValue();
    const next = multiple
      ? this.normalizeMultiple(
          [
            ...(current as string[]),
            ...(current.includes(option.value) ? [] : [option.value]),
          ],
          option.value
        )
      : option.value;
    if (multiple && (current as string[]).includes(option.value)) {
      const values = (current as string[]).filter(
        (value) => value !== option.value
      );
      this.commit(values, event);
      return;
    }
    this.commit(next, event);
    if (!multiple) this.state.open = false;
  }
  private normalizeMultiple(values: string[], _changed: string): string[] {
    const selected = new Set(values);
    return flattenOptions(this.props.options)
      .filter((option) => selected.has(option.value))
      .map((option) => option.value);
  }
  private commit(value: string | string[], event: Event): void {
    if (this.fieldContext)
      this.fieldContext.model.setValue(this.fieldContext.name, value);
    else if (this.props.value === undefined) this.state.internalValue = value;
    this.emit('input', {
      value,
      originalEvent: event,
    } satisfies OneFieldValueEvent<string | string[]>);
    this.emit('change', {
      value,
      originalEvent: event,
    } satisfies OneFieldValueEvent<string | string[]>);
  }
  private handleKeydown(event: Event, options: FlatOption[]): void {
    if (!(event instanceof KeyboardEvent)) return;
    if (event.key === 'Escape') {
      this.state.open = false;
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.state.open = true;
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      this.state.activeIndex =
        (this.state.activeIndex + direction + options.length) % options.length;
      return;
    }
    if (
      event.key === 'Enter' &&
      this.state.open &&
      options[this.state.activeIndex]
    ) {
      event.preventDefault();
      this.selectOption(options[this.state.activeIndex], event);
    }
  }
}
