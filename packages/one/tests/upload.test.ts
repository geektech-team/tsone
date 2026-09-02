import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import {
  OneUpload,
  formatOneFileSize,
  type OneUploadChangeEvent,
  type OneUploadFile,
} from '../lib';

describe('formatOneFileSize', () => {
  it('formats bytes into human readable units', () => {
    expect(formatOneFileSize(512)).toBe('512 B');
    expect(formatOneFileSize(2048)).toBe('2.0 KB');
    expect(formatOneFileSize(3 * 1024 * 1024)).toBe('3.0 MB');
  });
});

describe('OneUpload', () => {
  let container: HTMLElement;
  let component: OneUpload;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('renders a hidden native file input and a trigger label', () => {
    component = new OneUpload({
      accept: 'image/*',
      multiple: true,
      ariaLabel: '附件',
      children: ['上传文件'],
    });
    component.mount(container);

    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.type).toBe('file');
    expect(input.accept).toBe('image/*');
    expect(input.multiple).toBe(true);
    expect(input.getAttribute('aria-label')).toBe('附件');
    expect(input.className).toContain('one-upload__input');
    expect(container.querySelector('.one-upload__trigger')?.textContent).toContain(
      '上传文件'
    );
  });

  it('lists default files with sizes and removes one', () => {
    const files: OneUploadFile[] = [
      { id: 'a', name: 'readme.md', size: 2048 },
      { id: 'b', name: 'cover.png', size: 3 * 1024 * 1024 },
    ];
    component = new OneUpload({ defaultValue: files });
    const changes: Array<OneUploadChangeEvent> = [];
    component.on('change', (payload) =>
      changes.push(payload as OneUploadChangeEvent)
    );
    component.mount(container);

    const names = Array.from(
      container.querySelectorAll('.one-upload__item-name')
    ).map((node) => node.textContent);
    expect(names).toEqual(['readme.md', 'cover.png']);
    const sizes = Array.from(
      container.querySelectorAll('.one-upload__item-size')
    ).map((node) => node.textContent);
    expect(sizes).toEqual(['2.0 KB', '3.0 MB']);

    (container.querySelector('.one-upload__remove') as HTMLButtonElement).click();
    expect(changes[0].files.map((file) => file.id)).toEqual(['b']);
    const remaining = Array.from(
      container.querySelectorAll('.one-upload__item-name')
    ).map((node) => node.textContent);
    expect(remaining).toEqual(['cover.png']);
  });

  it('keeps the controlled file list after an attempted removal', () => {
    const files: OneUploadFile[] = [{ id: 'a', name: 'readme.md' }];
    component = new OneUpload({ value: files });
    const changes: Array<OneUploadChangeEvent> = [];
    component.on('change', (payload) =>
      changes.push(payload as OneUploadChangeEvent)
    );
    component.mount(container);

    (container.querySelector('.one-upload__remove') as HTMLButtonElement).click();
    expect(changes[0].files).toHaveLength(0);
    expect(container.querySelector('.one-upload__item-name')?.textContent).toBe(
      'readme.md'
    );
  });

  it('disables the input and remove buttons when disabled', () => {
    const files: OneUploadFile[] = [{ id: 'a', name: 'readme.md' }];
    component = new OneUpload({ defaultValue: files, disabled: true });
    component.mount(container);

    expect((container.querySelector('input') as HTMLInputElement).disabled).toBe(
      true
    );
    expect(
      (container.querySelector('.one-upload__remove') as HTMLButtonElement)
        .disabled
    ).toBe(true);
    expect(container.querySelector('.one-upload')?.className).toContain(
      'one-upload--disabled'
    );
  });
});
