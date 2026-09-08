import { type VNode } from '@geektech/tsone';
import { OneLocalizedComponent } from '../i18n';
import {
  normalizeNonNegativeInteger,
  normalizePositiveInteger,
  normalizePositiveIntegerList,
} from '../navigation';
import {
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  oneThemeBorder,
  type OneNamedStyle,
} from '../styles/shared';
import { createOnePaginationTokens } from './tokens';

export interface OnePaginationChangeEvent {
  page: number;
  pageSize: number;
  originalEvent: Event;
}

export interface OnePaginationProps {
  total: number;
  page?: number;
  defaultPage?: number;
  pageSize?: number;
  defaultPageSize?: number;
  pageSizeOptions?: readonly number[];
  siblingCount?: number;
  showQuickJumper?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}

interface OnePaginationState {
  internalPage: number;
  internalPageSize: number;
  jumpValue: string;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export const ONE_PAGINATION_STYLES: OneNamedStyle[] = [
  {
    name: 'one-pagination-base',
    selector: '.one-pagination',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      display: 'flex',
      flexWrap: 'wrap',
      gap: ONE_THEME_DEFAULTS.spaceSm,
      alignItems: 'center',
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
    },
  },
  {
    name: 'one-pagination-pages',
    selector: '.one-pagination__pages',
    properties: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: ONE_THEME_DEFAULTS.spaceXs,
      alignItems: 'center',
    },
  },
  {
    name: 'one-pagination-button',
    selector: '.one-pagination__button',
    properties: {
      minWidth: '32px',
      height: '32px',
      padding: `0 ${ONE_THEME_DEFAULTS.spaceSm}`,
      color: 'inherit',
      backgroundColor: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
      border: oneThemeBorder(),
      borderRadius: `var(--one-radius-sm, ${ONE_THEME_DEFAULTS.radiusSm})`,
      cursor: 'pointer',
      font: 'inherit',
    },
    hover: {
      color: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
      borderColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
  },
  {
    name: 'one-pagination-button-current',
    selector: '.one-pagination__button[aria-current="page"]',
    properties: {
      color: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
      backgroundColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
      borderColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
  },
  {
    name: 'one-pagination-button-disabled',
    selector: '.one-pagination__button:disabled',
    properties: {
      color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
      cursor: 'not-allowed',
      opacity: '0.55',
    },
  },
  {
    name: 'one-pagination-button-focus-visible',
    selector: '.one-pagination__button:focus-visible',
    properties: {
      outline: `2px solid var(--one-color-focus, ${ONE_THEME_DEFAULTS.colorFocus})`,
      outlineOffset: '2px',
    },
  },
  {
    name: 'one-pagination-ellipsis',
    selector: '.one-pagination__ellipsis',
    properties: {
      minWidth: '24px',
      color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
      textAlign: 'center',
    },
  },
  {
    name: 'one-pagination-control',
    selector: '.one-pagination__size, .one-pagination__jumper',
    properties: {
      height: '32px',
      padding: `0 ${ONE_THEME_DEFAULTS.spaceSm}`,
      color: 'inherit',
      backgroundColor: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
      border: oneThemeBorder(),
      borderRadius: `var(--one-radius-sm, ${ONE_THEME_DEFAULTS.radiusSm})`,
      font: 'inherit',
    },
  },
  {
    name: 'one-pagination-control-focus-visible',
    selector:
      '.one-pagination__size:focus-visible, .one-pagination__jumper:focus-visible',
    properties: {
      outline: `2px solid var(--one-color-focus, ${ONE_THEME_DEFAULTS.colorFocus})`,
      outlineOffset: '2px',
    },
  },
  {
    name: 'one-pagination-jumper',
    selector: '.one-pagination__jumper',
    properties: { width: '80px' },
  },
];

export class OnePagination extends OneLocalizedComponent<
  OnePaginationProps,
  OnePaginationState
> {
  protected initState(): OnePaginationState {
    return {
      internalPage: normalizePositiveInteger(this.props.defaultPage, 1),
      internalPageSize: normalizePositiveInteger(
        this.props.defaultPageSize,
        10
      ),
      jumpValue: '',
    };
  }

  protected initStyles(): void {
    ONE_PAGINATION_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    const pageSize = this.effectivePageSize();
    const pageCount = this.pageCount(pageSize);
    const page = this.effectivePage(pageSize);
    const disabled = this.props.disabled === true;
    const siblingCount = normalizeNonNegativeInteger(
      this.props.siblingCount,
      1
    );

    return {
      tag: 'nav',
      props: {
        className: 'one-pagination',
        'aria-label': this.props.ariaLabel ?? this.t('one.pagination.aria'),
      },
      children: [
        {
          tag: 'div',
          props: { className: 'one-pagination__pages' },
          children: [
            this.renderPageButton(
              this.t('one.pagination.prev'),
              '‹',
              page - 1,
              page <= 1
            ),
            ...createOnePaginationTokens(pageCount, page, siblingCount).map(
              (token) =>
                typeof token === 'number'
                  ? this.renderPageButton(
                      this.t('one.pagination.page', { page: token }),
                      String(token),
                      token,
                      false,
                      token === page
                    )
                  : this.renderEllipsis(token)
            ),
            this.renderPageButton(
              this.t('one.pagination.next'),
              '›',
              page + 1,
              page >= pageCount
            ),
          ],
        },
        {
          tag: 'select',
          props: {
            className: 'one-pagination__size',
            value: String(pageSize),
            disabled,
            'aria-label': this.t('one.pagination.pageSize'),
          },
          listeners: { change: (event) => this.handleSizeChange(event) },
          children: this.sizeOptions().map((option) => ({
            tag: 'option',
            props: {
              value: String(option),
              selected: option === pageSize,
            },
            children: [
              this.t('one.pagination.pageSizeOption', { size: option }),
            ],
          })),
        },
        ...(this.props.showQuickJumper
          ? [
              {
                tag: 'input',
                props: {
                  className: 'one-pagination__jumper',
                  type: 'text',
                  inputmode: 'numeric',
                  value: this.state.jumpValue,
                  disabled,
                  'aria-label': this.t('one.pagination.jump'),
                  placeholder: this.t('one.pagination.jumpPlaceholder'),
                },
                listeners: {
                  input: (event) => this.handleJumpInput(event),
                  keydown: (event) => this.handleJumpKeydown(event),
                  blur: (event) => this.submitJump(event),
                },
              } as VNode,
            ]
          : []),
      ],
    };
  }

  private effectivePageSize(): number {
    return normalizePositiveInteger(
      this.props.pageSize ?? this.state.internalPageSize,
      10
    );
  }

  private pageCount(pageSize = this.effectivePageSize()): number {
    const total = normalizeNonNegativeInteger(this.props.total, 0);
    return Math.max(1, Math.ceil(total / pageSize));
  }

  private effectivePage(pageSize = this.effectivePageSize()): number {
    const candidate = normalizePositiveInteger(
      this.props.page ?? this.state.internalPage,
      1
    );
    return Math.min(this.pageCount(pageSize), candidate);
  }

  private sizeOptions(): number[] {
    const active = this.effectivePageSize();
    const options = normalizePositiveIntegerList(
      this.props.pageSizeOptions,
      DEFAULT_PAGE_SIZE_OPTIONS
    );
    if (!options.includes(active)) options.push(active);
    return options;
  }

  private renderPageButton(
    ariaLabel: string,
    label: string,
    targetPage: number,
    boundaryDisabled: boolean,
    current = false
  ): VNode {
    const disabled = this.props.disabled === true || boundaryDisabled;
    return {
      tag: 'button',
      props: {
        className: 'one-pagination__button',
        type: 'button',
        disabled,
        'aria-label': ariaLabel,
        'aria-current': current ? 'page' : undefined,
      },
      listeners: {
        click: (event) =>
          this.requestChange(targetPage, this.effectivePageSize(), event),
      },
      children: [label],
    };
  }

  private renderEllipsis(token: string): VNode {
    return {
      tag: 'span',
      props: {
        className: 'one-pagination__ellipsis',
        'aria-hidden': 'true',
        'data-token': token,
      },
      children: ['…'],
    };
  }

  private handleSizeChange(event: Event): void {
    const select = event.currentTarget;
    if (!(select instanceof HTMLSelectElement) || this.props.disabled) return;
    const pageSize = normalizePositiveInteger(Number(select.value), 10);
    this.requestChange(this.effectivePage(), pageSize, event);
  }

  private handleJumpInput(event: Event): void {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement) || this.props.disabled) return;
    this.state.jumpValue = input.value;
  }

  private handleJumpKeydown(event: Event): void {
    if (!(event instanceof KeyboardEvent) || event.key !== 'Enter') return;
    event.preventDefault();
    this.submitJump(event);
  }

  private requestChange(page: number, pageSize: number, event: Event): void {
    if (this.props.disabled) return;
    const nextPageSize = normalizePositiveInteger(pageSize, 10);
    const nextPage = Math.min(
      this.pageCount(nextPageSize),
      normalizePositiveInteger(page, 1)
    );
    const currentPage = this.effectivePage();
    const currentPageSize = this.effectivePageSize();
    if (nextPage === currentPage && nextPageSize === currentPageSize) return;

    if (this.props.pageSize === undefined) {
      this.state.internalPageSize = nextPageSize;
    }
    if (this.props.page === undefined) {
      this.state.internalPage = nextPage;
    }
    this.emit('change', {
      page: nextPage,
      pageSize: nextPageSize,
      originalEvent: event,
    } satisfies OnePaginationChangeEvent);
  }

  private submitJump(event: Event): void {
    if (this.props.disabled) return;
    const value = this.state.jumpValue.trim();
    if (!value) return;
    const page = Number(value);
    this.state.jumpValue = '';
    if (event.currentTarget instanceof HTMLInputElement) {
      event.currentTarget.value = '';
    }
    if (!Number.isFinite(page)) return;
    this.requestChange(page, this.effectivePageSize(), event);
  }
}
