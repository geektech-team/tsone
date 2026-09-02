import { Component, type VNode } from '@geektech/tsone';
import {
  ONE_THEME_DEFAULTS,
  ONE_THEME_TYPOGRAPHY_PROPERTIES,
  oneThemeBorder,
  type OneNamedStyle,
} from '../styles/shared';

export interface OneUploadFile {
  id: string;
  name: string;
  size?: number;
  type?: string;
}

export interface OneUploadChangeEvent {
  files: OneUploadFile[];
  originalEvent: Event;
}

export interface OneUploadProps {
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  max?: number;
  value?: readonly OneUploadFile[];
  defaultValue?: readonly OneUploadFile[];
  ariaLabel?: string;
  children?: Array<VNode | string>;
}

interface OneUploadState {
  internalFiles: OneUploadFile[];
}

export const ONE_UPLOAD_STYLES: OneNamedStyle[] = [
  {
    name: 'one-upload-base',
    selector: '.one-upload',
    properties: {
      ...ONE_THEME_TYPOGRAPHY_PROPERTIES,
      display: 'flex',
      flexDirection: 'column',
      gap: `var(--one-space-sm, ${ONE_THEME_DEFAULTS.spaceSm})`,
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
    },
  },
  {
    name: 'one-upload-trigger',
    selector: '.one-upload__trigger',
    properties: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
      gap: `var(--one-space-xs, ${ONE_THEME_DEFAULTS.spaceXs})`,
      boxSizing: 'border-box',
      padding: `${ONE_THEME_DEFAULTS.spaceSm} ${ONE_THEME_DEFAULTS.spaceMd}`,
      borderRadius: `var(--one-radius-md, ${ONE_THEME_DEFAULTS.radiusMd})`,
      border: `1px dashed var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
      backgroundColor: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
      cursor: 'pointer',
      transition: 'border-color 150ms ease, color 150ms ease',
    },
  },
  {
    name: 'one-upload-trigger-hover',
    selector: '.one-upload__trigger:hover',
    properties: {
      borderColor: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
      color: `var(--one-color-primary, ${ONE_THEME_DEFAULTS.colorPrimary})`,
    },
  },
  {
    name: 'one-upload-input',
    selector: '.one-upload__input',
    properties: {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0 0 0 0)',
      whiteSpace: 'nowrap',
      border: '0',
    },
  },
  {
    name: 'one-upload-list',
    selector: '.one-upload__list',
    properties: {
      display: 'flex',
      flexDirection: 'column',
      gap: `var(--one-space-xs, ${ONE_THEME_DEFAULTS.spaceXs})`,
    },
  },
  {
    name: 'one-upload-item',
    selector: '.one-upload__item',
    properties: {
      display: 'flex',
      alignItems: 'center',
      gap: `var(--one-space-sm, ${ONE_THEME_DEFAULTS.spaceSm})`,
      padding: `${ONE_THEME_DEFAULTS.spaceXs} ${ONE_THEME_DEFAULTS.spaceSm}`,
      borderRadius: `var(--one-radius-sm, ${ONE_THEME_DEFAULTS.radiusSm})`,
      backgroundColor: `var(--one-color-surface, ${ONE_THEME_DEFAULTS.colorSurface})`,
      border: oneThemeBorder(
        `var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`
      ),
    },
  },
  {
    name: 'one-upload-item-name',
    selector: '.one-upload__item-name',
    properties: {
      flex: '1',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      color: `var(--one-color-text, ${ONE_THEME_DEFAULTS.colorText})`,
    },
  },
  {
    name: 'one-upload-item-size',
    selector: '.one-upload__item-size',
    properties: {
      flexShrink: '0',
      color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
      fontSize: `var(--one-font-size-sm, ${ONE_THEME_DEFAULTS.fontSizeSm})`,
    },
  },
  {
    name: 'one-upload-remove',
    selector: '.one-upload__remove',
    properties: {
      appearance: 'none',
      border: 'none',
      background: 'transparent',
      padding: '2px 6px',
      cursor: 'pointer',
      color: `var(--one-color-muted, ${ONE_THEME_DEFAULTS.colorMuted})`,
      borderRadius: `var(--one-radius-sm, ${ONE_THEME_DEFAULTS.radiusSm})`,
    },
  },
  {
    name: 'one-upload-remove-hover',
    selector: '.one-upload__remove:hover',
    properties: {
      color: `var(--one-color-danger, ${ONE_THEME_DEFAULTS.colorDanger})`,
      backgroundColor: `var(--one-color-border, ${ONE_THEME_DEFAULTS.colorBorder})`,
    },
  },
  {
    name: 'one-upload-disabled',
    selector: '.one-upload--disabled',
    properties: { opacity: '0.5', pointerEvents: 'none' },
  },
];

let uploadFileSequence = 0;

function nextUploadFileId(): string {
  uploadFileSequence += 1;
  return `one-upload-${uploadFileSequence}`;
}

export function formatOneFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export class OneUpload extends Component<OneUploadProps, OneUploadState> {
  protected initState(): OneUploadState {
    return { internalFiles: [...(this.props.defaultValue ?? [])] };
  }

  protected initStyles(): void {
    ONE_UPLOAD_STYLES.forEach(({ name, ...style }) => {
      this.styleManager.addStyle(name, style);
    });
  }

  protected render(): VNode {
    const disabled = this.props.disabled === true;
    const files = this.getFiles();
    const triggerLabel =
      this.props.children && this.props.children.length > 0
        ? this.props.children
        : ['选择文件'];

    return {
      tag: 'div',
      props: {
        className: ['one-upload', ...(disabled ? ['one-upload--disabled'] : [])].join(
          ' '
        ),
      },
      children: [
        {
          tag: 'label',
          props: { className: 'one-upload__trigger' },
          children: [
            {
              tag: 'input',
              props: {
                type: 'file',
                className: 'one-upload__input',
                accept: this.props.accept,
                multiple: this.props.multiple === true || undefined,
                disabled: this.props.disabled === true || undefined,
                'aria-label': this.props.ariaLabel,
              },
              listeners: {
                change: (event) => this.handleFiles(event),
              },
            } as VNode,
            ...triggerLabel,
          ],
        } as VNode,
        ...(files.length > 0
          ? [
              {
                tag: 'ul',
                props: { className: 'one-upload__list' },
                children: files.map((file) => ({
                  tag: 'li',
                  props: { className: 'one-upload__item' },
                  children: [
                    {
                      tag: 'span',
                      props: { className: 'one-upload__item-name' },
                      children: [file.name],
                    },
                    ...(file.size !== undefined
                      ? [
                          {
                            tag: 'span',
                            props: { className: 'one-upload__item-size' },
                            children: [formatOneFileSize(file.size)],
                          } as VNode,
                        ]
                      : []),
                    {
                      tag: 'button',
                      props: {
                        type: 'button',
                        className: 'one-upload__remove',
                        'aria-label': `移除 ${file.name}`,
                        disabled: this.props.disabled === true || undefined,
                      },
                      listeners: {
                        click: () => this.removeFile(file.id),
                      },
                    },
                  ],
                })),
              } as VNode,
            ]
          : []),
      ],
    };
  }

  private getFiles(): readonly OneUploadFile[] {
    return this.props.value ?? this.state.internalFiles;
  }

  private handleFiles(event: Event): void {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement) || this.props.disabled) return;
    const incoming = Array.from(input.files ?? []).map((file) => ({
      id: nextUploadFileId(),
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    const current = this.getFiles();
    const merged = this.props.multiple === true
      ? [...current, ...incoming]
      : incoming;
    const max = this.props.max;
    const files =
      typeof max === 'number' && max >= 1 ? merged.slice(0, max) : merged;
    if (this.props.value === undefined) {
      this.setState({ internalFiles: files });
    }
    this.emit('change', {
      files,
      originalEvent: event,
    } satisfies OneUploadChangeEvent);
    input.value = '';
  }

  private removeFile(id: string): void {
    if (this.props.disabled === true) return;
    const files = this.getFiles().filter((file) => file.id !== id);
    if (this.props.value === undefined) {
      this.setState({ internalFiles: files });
    }
    this.emit('change', {
      files,
      originalEvent: new Event('change'),
    } satisfies OneUploadChangeEvent);
  }
}
