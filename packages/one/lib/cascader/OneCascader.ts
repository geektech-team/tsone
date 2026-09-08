import { type VNode } from '@geektech/tsone';
import { OneLocalizedComponent } from '../i18n';
import type { OneFieldValueEvent, OneFormFieldContext } from '../form/context';
import { ONE_FORM_FIELD_KEY } from '../form/context';
import { bindOneFloatingPanel } from '../dropdown';
import {
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  oneThemeBorder,
  type OneNamedStyle,
} from '../styles/shared';

export interface OneCascaderOption {
  value: string;
  label: string;
  disabled?: boolean;
  children?: readonly OneCascaderOption[];
}

export interface OneCascaderProps {
  options: readonly OneCascaderOption[];
  value?: readonly string[];
  defaultValue?: readonly string[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  changeOnSelect?: boolean;
  ariaLabel?: string;
}

interface OneCascaderState {
  open: boolean;
  activePath: string[];
  activeIndexes: number[];
  internalValue: string[];
  revision: number;
}

export const ONE_CASCADER_STYLES: OneNamedStyle[] = [
  {
    name: 'one-cascader-base',
    selector: '.one-cascader',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      position: 'relative',
      width: '100%',
    },
  },
  {
    name: 'one-cascader-trigger',
    selector: '.one-cascader__trigger',
    properties: {
      width: '100%',
      minHeight: '40px',
      textAlign: 'left',
      border: oneThemeBorder(),
      borderRadius: `var(--one-radius-md, ${ONE_THEME_DEFAULTS.radiusMd})`,
      backgroundColor: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
    },
  },
  {
    name: 'one-cascader-panel',
    selector: '.one-cascader__panel',
    properties: {
      position: 'fixed',
      zIndex: '1000',
      display: 'flex',
      minHeight: '80px',
      border: oneThemeBorder(),
      borderRadius: `var(--one-radius-md, ${ONE_THEME_DEFAULTS.radiusMd})`,
      backgroundColor: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
      boxShadow: `var(--one-shadow-card, ${ONE_THEME_DEFAULTS.shadowCard})`,
    },
  },
  {
    name: 'one-cascader-column',
    selector: '.one-cascader__column',
    properties: {
      minWidth: '120px',
      padding: '4px',
      overflowY: 'auto',
      maxHeight: '240px',
    },
  },
  {
    name: 'one-cascader-column-divider',
    selector: '.one-cascader__column + .one-cascader__column',
    properties: {
      borderLeft: oneThemeBorder(),
    },
  },
  {
    name: 'one-cascader-option',
    selector: '.one-cascader__option',
    properties: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '8px',
      width: '100%',
      padding: '8px',
      textAlign: 'left',
      backgroundColor: 'transparent',
      border: '0',
    },
  },
  {
    name: 'one-cascader-caret',
    selector: '.one-cascader__caret',
    properties: {
      color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
      lineHeight: '1',
    },
  },
  {
    name: 'one-cascader-option-selected',
    selector: '.one-cascader__option--selected',
    properties: {
      color: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
  },
  {
    name: 'one-cascader-option-disabled',
    selector: '.one-cascader__option--disabled',
    properties: { opacity: '0.5', cursor: 'not-allowed' },
  },
];

function hasChildren(option: OneCascaderOption): boolean {
  return Boolean(option.children && option.children.length > 0);
}

function resolveLabels(
  options: readonly OneCascaderOption[],
  path: readonly string[]
): string[] {
  const labels: string[] = [];
  let level: readonly OneCascaderOption[] = options;
  for (const value of path) {
    const node = level.find((option) => option.value === value);
    if (!node) break;
    labels.push(node.label);
    if (!node.children) break;
    level = node.children;
  }
  return labels;
}

function normalizeCascaderValue(
  value: unknown,
  options: readonly OneCascaderOption[]
): string[] {
  if (!Array.isArray(value)) return [];
  const path = value.filter(
    (item): item is string => typeof item === 'string'
  );
  const valid: string[] = [];
  let level: readonly OneCascaderOption[] = options;
  for (const item of path) {
    const node = level.find((option) => option.value === item);
    if (!node) return valid.length > 0 ? valid : [];
    valid.push(item);
    if (!node.children) break;
    level = node.children;
  }
  return valid;
}

export class OneCascader extends OneLocalizedComponent<
  OneCascaderProps,
  OneCascaderState
> {
  private fieldContext: OneFormFieldContext | undefined;
  private unsubscribe: (() => void) | undefined;
  private floatingCleanup: (() => void) | undefined;

  protected initState(): OneCascaderState {
    const value = normalizeCascaderValue(
      this.props.value ?? this.props.defaultValue,
      this.props.options
    );
    return {
      open: false,
      activePath: [...value],
      activeIndexes: [],
      internalValue: value,
      revision: 0,
    };
  }

  protected initStyles(): void {
    ONE_CASCADER_STYLES.forEach(({ name, ...style }) =>
      this.styleManager.addStyle(name, style)
    );
  }

  protected beforeMount(): void {
    this.fieldContext = this.inject(ONE_FORM_FIELD_KEY);
    this.fieldContext?.model.ensureValue(
      this.fieldContext.name,
      normalizeCascaderValue(
        this.props.value ?? this.props.defaultValue,
        this.props.options
      )
    );
  }

  protected onMounted(): void {
    this.unsubscribe = this.fieldContext?.model.subscribe(() => {
      this.state.revision += 1;
    });
  }

  protected onUpdated(): void {
    this.floatingCleanup?.();
    this.floatingCleanup = undefined;
    const root = this.getElement();
    if (!this.state.open || !(root instanceof HTMLElement)) return;
    const trigger = root.querySelector<HTMLElement>('.one-cascader__trigger');
    const panel = root.querySelector<HTMLElement>('.one-cascader__panel');
    if (!trigger || !panel) return;
    this.floatingCleanup = bindOneFloatingPanel({
      trigger,
      panel,
      onOutside: () => {
        this.state.open = false;
      },
    });
  }

  protected onUnmounted(): void {
    this.floatingCleanup?.();
    this.floatingCleanup = undefined;
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.fieldContext = undefined;
  }

  protected render(): VNode {
    void this.state.revision;
    const value = this.getValue();
    const invalid =
      this.props.invalid ||
      (this.fieldContext?.model.getErrors(this.fieldContext.name).length ?? 0) >
        0;
    const label = resolveLabels(this.props.options, value).join(' / ');
    return {
      tag: 'div',
      props: { className: 'one-cascader' },
      children: [
        {
          tag: 'button',
          props: {
            type: 'button',
            className: 'one-cascader__trigger',
            role: 'combobox',
            disabled: this.props.disabled === true,
            id: this.fieldContext?.controlId,
            name: this.fieldContext?.name,
            'aria-label': this.props.ariaLabel,
            'aria-haspopup': 'listbox',
            'aria-expanded': this.state.open ? 'true' : 'false',
            'aria-invalid': invalid ? 'true' : undefined,
            'aria-describedby': this.fieldContext?.describedBy,
          },
          children: [
            label || this.props.placeholder || this.t('one.cascader.placeholder'),
          ],
          listeners: {
            click: () => {
              if (!this.props.disabled) this.state.open = !this.state.open;
            },
            keydown: (event) => this.handleKeydown(event),
          },
        },
        ...(this.state.open ? this.renderPanel() : []),
      ],
    };
  }

  private renderPanel(): VNode[] {
    const columns = this.resolveColumns();
    return [
      {
        tag: 'div',
        props: {
          className: 'one-cascader__panel',
          id: 'one-cascader-listbox',
          role: 'listbox',
        },
        children: columns.map((column, columnIndex) => ({
          tag: 'div',
          props: { className: 'one-cascader__column' },
          children: column.map((option) => {
            const selected = this.isOptionSelected(columnIndex, option);
            return {
              tag: 'button',
              props: {
                type: 'button',
                className: [
                  'one-cascader__option',
                  ...(selected ? ['one-cascader__option--selected'] : []),
                  ...(option.disabled
                    ? ['one-cascader__option--disabled']
                    : []),
                ].join(' '),
                role: 'option',
                disabled: option.disabled === true,
                'aria-selected': selected ? 'true' : 'false',
              },
              children: [
                option.label,
                ...(hasChildren(option)
                  ? [{ tag: 'span', props: { className: 'one-cascader__caret' }, children: ['›'] } as VNode]
                  : []),
              ],
              listeners: {
                click: (event) => this.selectOption(columnIndex, option, event),
              },
            } as VNode;
          }),
        })),
      } as VNode,
    ];
  }

  private resolveColumns(): OneCascaderOption[][] {
    const columns: OneCascaderOption[][] = [this.props.options as OneCascaderOption[]];
    let level: readonly OneCascaderOption[] = this.props.options;
    for (const value of this.state.activePath) {
      const node = level.find((option) => option.value === value);
      if (!node || !node.children) break;
      columns.push(node.children as OneCascaderOption[]);
      level = node.children;
    }
    return columns;
  }

  private isOptionSelected(
    columnIndex: number,
    option: OneCascaderOption
  ): boolean {
    return this.state.activePath[columnIndex] === option.value;
  }

  private selectOption(
    columnIndex: number,
    option: OneCascaderOption,
    event: Event
  ): void {
    if (option.disabled) return;
    const prefix = this.state.activePath.slice(0, columnIndex);
    const path = [...prefix, option.value];
    if (this.props.changeOnSelect) {
      this.commit(path, event);
      if (hasChildren(option)) {
        this.state.activePath = path;
      } else {
        this.state.open = false;
      }
      return;
    }
    if (hasChildren(option)) {
      this.state.activePath = path;
      return;
    }
    this.commit(path, event);
    this.state.open = false;
  }

  private handleKeydown(event: Event): void {
    if (!(event instanceof KeyboardEvent)) return;
    if (event.key === 'Escape') {
      this.state.open = false;
      return;
    }
    if (!this.state.open) return;
    const columns = this.resolveColumns();
    const columnCount = columns.length;
    const current = Math.min(this.state.activeIndexes.length - 1, columnCount - 1);
    const column = Math.max(0, current);
    const columnOptions = columns[column] ?? [];
    const index = this.state.activeIndexes[column] ?? 0;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const next = (index + direction + columnOptions.length) % columnOptions.length;
      this.state.activeIndexes[column] = next;
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      const nextColumn = Math.min(column + 1, columnCount - 1);
      this.state.activeIndexes[nextColumn] = 0;
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const prev = Math.max(column - 1, 0);
      this.state.activeIndexes[prev] = 0;
      return;
    }
    if (event.key === 'Enter' && columnOptions[index]) {
      event.preventDefault();
      this.selectOption(column, columnOptions[index], event);
    }
  }

  private getValue(): string[] {
    const value = this.fieldContext?.model.getValue(this.fieldContext.name);
    return value !== undefined
      ? normalizeCascaderValue(value, this.props.options)
      : normalizeCascaderValue(
          this.props.value ?? this.state.internalValue,
          this.props.options
        );
  }

  private commit(path: string[], event: Event): void {
    const value = normalizeCascaderValue(path, this.props.options);
    if (this.fieldContext)
      this.fieldContext.model.setValue(this.fieldContext.name, value);
    else if (this.props.value === undefined) this.state.internalValue = value;
    this.state.activePath = [...value];
    this.emit('input', {
      value,
      originalEvent: event,
    } satisfies OneFieldValueEvent<string[]>);
    this.emit('change', {
      value,
      originalEvent: event,
    } satisfies OneFieldValueEvent<string[]>);
  }
}
