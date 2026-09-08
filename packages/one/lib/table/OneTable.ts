import { type VNode } from '@geektech/tsone';
import { OneLocalizedComponent } from '../i18n';
import {
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  oneThemeBorder,
  type OneNamedStyle,
} from '../styles/shared';

export type OneTableRow = Record<string, unknown>;

export interface OneTableColumn<T extends OneTableRow = OneTableRow> {
  key: string;
  title?: string;
  render?: (row: T) => VNode | string | number | boolean | null | undefined;
}

export interface OneTableProps<T extends OneTableRow = OneTableRow> {
  data?: readonly T[];
  columns?: readonly OneTableColumn<T>[];
  rowKey?: string;
  striped?: boolean;
  hover?: boolean;
  emptyText?: string;
  ariaLabel?: string;
}

export const ONE_TABLE_STYLES: OneNamedStyle[] = [
  {
    name: 'one-table-wrap',
    selector: '.one-table__wrap',
    properties: {
      width: '100%',
      overflowX: 'auto',
      border: oneThemeBorder(),
      borderRadius: `var(--one-radius-md, ${ONE_THEME_DEFAULTS.radiusMd})`,
    },
  },
  {
    name: 'one-table-base',
    selector: '.one-table',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      width: '100%',
      borderCollapse: 'collapse',
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
    },
  },
  {
    name: 'one-table-head',
    selector: '.one-table__head',
    properties: {
      padding: `${ONE_THEME_DEFAULTS.spaceSm} ${ONE_THEME_DEFAULTS.spaceMd}`,
      textAlign: 'left',
      borderBottom: `2px solid var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
      color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
      fontSize: `var(--one-font-size-sm, ${ONE_THEME_DEFAULTS.fontSizeSm})`,
      fontWeight: '600',
      whiteSpace: 'nowrap',
    },
  },
  {
    name: 'one-table-cell',
    selector: '.one-table__cell',
    properties: {
      padding: `${ONE_THEME_DEFAULTS.spaceSm} ${ONE_THEME_DEFAULTS.spaceMd}`,
      borderBottom: oneThemeBorder(),
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
      verticalAlign: 'middle',
    },
  },
  {
    name: 'one-table-row-hover',
    selector: '.one-table--hover tbody tr:hover',
    properties: {
      backgroundColor: `var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
    },
  },
  {
    name: 'one-table-row-striped',
    selector: '.one-table--striped tbody tr:nth-child(even)',
    properties: {
      backgroundColor: `var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
    },
  },
  {
    name: 'one-table-empty',
    selector: '.one-table__empty',
    properties: {
      padding: `${ONE_THEME_DEFAULTS.spaceLg}`,
      textAlign: 'center',
      color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
    },
  },
];

function isVNodeLike(value: object): boolean {
  return 'tag' in value || 'component' in value;
}

export class OneTable extends OneLocalizedComponent<OneTableProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {
    ONE_TABLE_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    const data = this.props.data ?? [];
    const columns = this.resolveColumns(data);
    const rowKey = this.props.rowKey;

    const headRows = columns.map((column) => ({
      tag: 'th',
      props: {
        scope: 'col',
        className: 'one-table__head',
      },
      children: [column.title ?? column.key],
    }));

    const bodyRows = data.map((row, index) => {
      const keyValue = rowKey ? row[rowKey] : undefined;
      const key =
        typeof keyValue === 'string' || typeof keyValue === 'number'
          ? String(keyValue)
          : String(index);
      return {
        tag: 'tr',
        key,
        children: columns.map((column) => ({
          tag: 'td',
          props: { className: 'one-table__cell' },
          children: [this.renderCell(column, row)],
        })),
      };
    });

    const body =
      bodyRows.length > 0
        ? bodyRows
        : [
            {
              tag: 'tr',
              children: [
                {
                  tag: 'td',
                  props: {
                    className: 'one-table__empty',
                    colSpan: Math.max(columns.length, 1),
                  },
                  children: [this.props.emptyText ?? this.t('one.table.empty')],
                },
              ],
            },
          ];

    return {
      tag: 'div',
      props: { className: 'one-table__wrap' },
      children: [
        {
          tag: 'table',
          props: {
            className: [
              'one-table',
              ...(this.props.hover === true ? ['one-table--hover'] : []),
              ...(this.props.striped === true ? ['one-table--striped'] : []),
            ].join(' '),
            'aria-label': this.props.ariaLabel,
          },
          children: [
            {
              tag: 'thead',
              children: [
                {
                  tag: 'tr',
                  children: headRows,
                } as VNode,
              ],
            } as VNode,
            { tag: 'tbody', children: body },
          ],
        } as VNode,
      ],
    };
  }

  private resolveColumns(data: readonly OneTableRow[]): OneTableColumn[] {
    if (this.props.columns && this.props.columns.length > 0) {
      return this.props.columns as OneTableColumn[];
    }
    const first = data[0];
    if (!first) return [];
    return Object.keys(first).map((key) => ({ key }));
  }

  private renderCell(
    column: OneTableColumn,
    row: OneTableRow
  ): VNode | string {
    const value = column.render ? column.render(row) : row[column.key];
    return this.normalizeCell(value);
  }

  private normalizeCell(value: unknown): VNode | string {
    if (value == null) return '';
    if (typeof value === 'object') {
      return isVNodeLike(value) ? (value as VNode) : '';
    }
    return String(value);
  }
}
