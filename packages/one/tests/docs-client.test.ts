import { beforeEach, describe, expect, it } from 'bun:test';
import { mountOneDocsClient } from '../docs/app/client';

function getButton(
  label: string,
  root: ParentNode = document
): HTMLButtonElement {
  const button = [...root.querySelectorAll('button')].find(
    (candidate) => candidate.textContent === label
  );
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Missing button: ${label}`);
  }
  return button;
}

describe('One UI docs client', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('mounts each real component demo into marked roots', () => {
    document.body.innerHTML = [
      '<div data-one-demo="button"></div>',
      '<div data-one-demo="input"></div>',
      '<div data-one-demo="card"></div>',
      '<div data-one-demo="tag"></div>',
      '<div data-one-demo="badge"></div>',
      '<div data-one-demo="empty"></div>',
      '<div data-one-demo="form"></div>',
      '<div data-one-demo="select"></div>',
      '<div data-one-demo="checkbox"></div>',
      '<div data-one-demo="switch"></div>',
      '<div data-one-demo="alert"></div>',
      '<div data-one-demo="message"></div>',
      '<div data-one-demo="dialog"></div>',
      '<div data-one-demo="tooltip"></div>',
      '<div data-one-demo="tabs"></div>',
      '<div data-one-demo="breadcrumb"></div>',
      '<div data-one-demo="pagination"></div>',
    ].join('');

    mountOneDocsClient();

    expect(document.querySelector('.one-button')).toBeTruthy();
    expect(document.querySelector('.one-input')).toBeTruthy();
    expect(document.querySelector('.one-card')).toBeTruthy();
    expect(document.querySelector('.one-tag')).toBeTruthy();
    expect(document.querySelector('.one-badge')).toBeTruthy();
    expect(document.querySelector('.one-empty')).toBeTruthy();
    expect(document.querySelector('.one-form')).toBeTruthy();
    expect(document.querySelector('.one-select')).toBeTruthy();
    expect(document.querySelector('.one-checkbox-group')).toBeTruthy();
    expect(document.querySelector('.one-switch')).toBeTruthy();
    expect(document.querySelector('.one-alert')).toBeTruthy();
    expect(
      document.querySelector('.one-docs-feedback-actions .one-button')
    ).toBeTruthy();
    expect(
      document.querySelector('.one-docs-dialog-demo .one-button')
    ).toBeTruthy();
    expect(
      document.querySelector('.one-docs-tooltip-demo .one-button')
    ).toBeTruthy();
    expect(document.querySelector('.one-tabs')).toBeTruthy();
    expect(document.querySelector('.one-breadcrumb')).toBeTruthy();
    expect(document.querySelector('.one-pagination')).toBeTruthy();
  });

  it('reuses One controls throughout feedback demos', () => {
    document.body.innerHTML = [
      '<div data-one-demo="alert"></div>',
      '<div data-one-demo="message"></div>',
      '<div data-one-demo="dialog"></div>',
      '<div data-one-demo="tooltip"></div>',
    ].join('');
    mountOneDocsClient();

    const alertRoot = document.querySelector('[data-one-demo="alert"]');
    const messageRoot = document.querySelector('[data-one-demo="message"]');
    const dialogRoot = document.querySelector('[data-one-demo="dialog"]');
    const tooltipRoot = document.querySelector('[data-one-demo="tooltip"]');

    expect(
      alertRoot?.querySelector('.one-alert__actions .one-button')
    ).toBeTruthy();
    expect(messageRoot?.querySelectorAll('.one-button')).toHaveLength(4);
    expect(dialogRoot?.querySelectorAll('.one-button')).toHaveLength(4);
    expect(tooltipRoot?.querySelector('.one-select')).toBeTruthy();
    expect(tooltipRoot?.querySelectorAll('.one-button')).toHaveLength(3);
  });

  it('updates the button click count', () => {
    document.body.innerHTML = '<div data-one-demo="button"></div>';
    mountOneDocsClient();

    const button = document.querySelector('.one-button--primary');
    expect(button).toBeInstanceOf(HTMLButtonElement);
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(document.querySelector('[data-one-click-count]')?.textContent).toBe(
      '点击次数：1'
    );
  });

  it('mounts the same demo root only once across repeated calls', () => {
    document.body.innerHTML = '<div data-one-demo="button"></div>';

    mountOneDocsClient();
    mountOneDocsClient();

    expect(document.querySelectorAll('.one-button')).toHaveLength(3);
    expect(document.querySelectorAll('[data-one-click-count]')).toHaveLength(1);

    const button = document.querySelector('.one-button--primary');
    expect(button).toBeInstanceOf(HTMLButtonElement);
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(document.querySelector('[data-one-click-count]')?.textContent).toBe(
      '点击次数：1'
    );
  });

  it('keeps the controlled input value in parent state', () => {
    document.body.innerHTML = '<div data-one-demo="input"></div>';
    mountOneDocsClient();

    const input = document.querySelector('[aria-label="受控输入"]');
    expect(input).toBeInstanceOf(HTMLInputElement);
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Controlled input did not mount');
    }

    input.value = '父组件状态';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(input.value).toBe('父组件状态');
    expect(
      document.querySelector('[data-one-controlled-value]')?.textContent
    ).toBe('受控值：父组件状态');
  });

  it('counts tags closed from the interactive tag demo', () => {
    document.body.innerHTML = '<div data-one-demo="tag"></div>';
    mountOneDocsClient();

    const closeButton = document.querySelector(
      '.one-tag__close'
    ) as HTMLButtonElement | null;
    expect(closeButton).toBeInstanceOf(HTMLButtonElement);
    closeButton?.click();

    expect(document.querySelector('[data-one-tag-result]')?.textContent).toBe(
      '已关闭 1 个标签'
    );
  });

  it('increments and caps the interactive badge count', () => {
    document.body.innerHTML = '<div data-one-demo="badge"></div>';
    mountOneDocsClient();

    expect(document.querySelector('.one-badge__content')?.textContent).toBe(
      '99'
    );
    const incrementButton = [...document.querySelectorAll('button')].find(
      (button) => button.textContent === '增加数量'
    );
    expect(incrementButton).toBeInstanceOf(HTMLButtonElement);
    incrementButton?.click();

    expect(document.querySelector('.one-badge__content')?.textContent).toBe(
      '99+'
    );
    expect(document.querySelector('[data-one-badge-result]')?.textContent).toBe(
      '当前数量：100'
    );
  });

  it('runs the empty-state action from the interactive empty demo', () => {
    document.body.innerHTML = '<div data-one-demo="empty"></div>';
    mountOneDocsClient();

    const createButton = [...document.querySelectorAll('button')].find(
      (button) => button.textContent === '创建项目'
    );
    expect(createButton).toBeInstanceOf(HTMLButtonElement);
    createButton?.click();

    expect(document.querySelector('[data-one-empty-result]')?.textContent).toBe(
      '已请求创建项目'
    );
  });

  it('mounts an interactive switch demo that toggles in both directions', () => {
    document.body.innerHTML = '<div data-one-demo="switch"></div>';
    mountOneDocsClient();

    const initialSwitch = document.querySelector('[role="switch"]');
    const initialInput = document.querySelector(
      '.one-switch__input'
    ) as HTMLInputElement | null;
    expect(initialSwitch?.getAttribute('aria-checked')).toBe('false');
    expect(initialInput).toBeInstanceOf(HTMLInputElement);
    if (!initialInput) {
      throw new Error('Interactive switch input did not mount');
    }

    initialInput.checked = true;
    initialInput.dispatchEvent(new Event('change', { bubbles: true }));
    expect(
      document.querySelector('[role="switch"]')?.getAttribute('aria-checked')
    ).toBe('true');

    const checkedInput = document.querySelector(
      '.one-switch__input'
    ) as HTMLInputElement;
    checkedInput.checked = false;
    checkedInput.dispatchEvent(new Event('change', { bubbles: true }));
    expect(
      document.querySelector('[role="switch"]')?.getAttribute('aria-checked')
    ).toBe('false');
  });

  it('validates and submits values in the interactive form demo', () => {
    document.body.innerHTML = '<div data-one-demo="form"></div>';
    mountOneDocsClient();

    const form = document.querySelector('form') as HTMLFormElement | null;
    expect(form?.tagName).toBe('FORM');
    form?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      '请输入项目名称'
    );

    const input = document.querySelector(
      '[aria-label="项目名称"]'
    ) as HTMLInputElement;
    input.value = 'one-ui';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    form?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );

    expect(
      [...document.querySelectorAll('[role="alert"]')].map(
        (alert) => alert.textContent
      )
    ).toEqual([]);

    expect(
      document.querySelector('[data-one-form-result]')?.textContent
    ).toContain('one-ui');

    const resetButton = document.querySelector(
      '.one-button[type="reset"]'
    ) as HTMLButtonElement | null;
    expect(resetButton).toBeInstanceOf(HTMLButtonElement);
    resetButton?.click();
    expect(document.querySelector('form')).toBeTruthy();
    expect(document.querySelector('.one-form-item')).toBeTruthy();
    expect(document.querySelectorAll('input').length).toBeGreaterThan(0);
    expect(
      (document.querySelector('[aria-label="项目名称"]') as HTMLInputElement)
        .value
    ).toBe('');
  });

  it('shows selected values in the interactive select demo', () => {
    document.body.innerHTML = '<div data-one-demo="select"></div>';
    mountOneDocsClient();

    document
      .querySelector('[role="combobox"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    document
      .querySelector('[role="option"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(
      document.querySelector('[data-one-select-value]')?.textContent
    ).toContain('beijing');
  });

  it('shows checkbox and group values in the interactive checkbox demo', () => {
    document.body.innerHTML = '<div data-one-demo="checkbox"></div>';
    mountOneDocsClient();

    const agreement = document.querySelector(
      '[aria-label="同意协议"]'
    ) as HTMLInputElement;
    agreement.checked = true;
    agreement.dispatchEvent(new Event('change', { bubbles: true }));

    const firstGroupOption = document.querySelector(
      '.one-checkbox-group input'
    ) as HTMLInputElement;
    firstGroupOption.checked = true;
    firstGroupOption.dispatchEvent(new Event('change', { bubbles: true }));

    expect(
      document.querySelector('[data-one-checkbox-value]')?.textContent
    ).toContain('true');
    expect(
      document.querySelector('[data-one-checkbox-group-value]')?.textContent
    ).toContain('design');
  });

  it('closes an alert and runs its explicit action', () => {
    document.body.innerHTML = '<div data-one-demo="alert"></div>';
    mountOneDocsClient();

    getButton('撤销').click();
    expect(document.querySelector('[data-one-alert-result]')?.textContent).toBe(
      '已撤销 1 次'
    );
    const before = document.querySelectorAll('.one-alert').length;
    (document.querySelector('.one-alert__close') as HTMLButtonElement).click();
    expect(document.querySelectorAll('.one-alert')).toHaveLength(before - 1);
  });

  it('opens, updates and closes command-created feedback demos', async () => {
    document.body.innerHTML = [
      '<div data-one-demo="message"></div>',
      '<div data-one-demo="dialog"></div>',
    ].join('');
    mountOneDocsClient();
    getButton('成功消息').click();
    expect(document.body.querySelector('.one-message')?.textContent).toContain(
      '保存成功'
    );
    getButton('更新最近消息').click();
    expect(document.body.querySelector('.one-message')?.textContent).toContain(
      '内容已更新'
    );
    getButton('关闭全部').click();
    expect(document.body.querySelector('.one-message')).toBeNull();

    getButton('打开 Dialog').click();
    expect(document.body.querySelector('[role="dialog"]')).toBeTruthy();
    (
      document.querySelector('.one-dialog__cancel') as HTMLButtonElement
    ).click();
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();

    getButton('异步确认').click();
    (
      document.querySelector('.one-dialog__confirm') as HTMLButtonElement
    ).click();
    await Promise.resolve();
    expect(
      document.querySelector('[data-one-dialog-result]')?.textContent
    ).toBe('确认结果：true');

    getButton('受控 Dialog').click();
    expect(document.body.querySelector('[role="dialog"]')).toBeTruthy();
    (
      document.querySelector('.one-dialog__cancel') as HTMLButtonElement
    ).click();
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
  });

  it('demonstrates Tooltip placement, edge flip, click and manual modes', () => {
    document.body.innerHTML = '<div data-one-demo="tooltip"></div>';
    mountOneDocsClient();
    const trigger = getButton('点击提示');

    trigger.click();
    const tooltip = document.querySelector('[role="tooltip"]') as HTMLElement;
    expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id);
    expect(tooltip.dataset.placement).toBe('bottom');

    getButton('打开手动提示').click();
    expect(document.querySelectorAll('[role="tooltip"]')).toHaveLength(1);
    expect(document.querySelector('[role="tooltip"]')?.textContent).toContain(
      '由 open 属性控制'
    );
    expect(
      document.querySelector('[data-one-tooltip-result]')?.textContent
    ).toContain('请求位置：top');

    getButton('关闭手动提示').click();
    expect(document.querySelector('[role="tooltip"]')).toBeNull();

    document
      .querySelector('[aria-label="首选位置"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    getButton('bottom-end').click();
    expect(
      document.querySelector('[data-one-tooltip-result]')?.textContent
    ).toContain('请求位置：bottom-end');
  });

  it('switches tabs, expands breadcrumbs and controls pagination', () => {
    document.body.innerHTML = [
      '<div data-one-demo="tabs"></div>',
      '<div data-one-demo="breadcrumb"></div>',
      '<div data-one-demo="pagination"></div>',
    ].join('');
    mountOneDocsClient();

    getButton('安全').click();
    expect(document.querySelector('[data-one-tabs-result]')?.textContent).toBe(
      '当前标签：security'
    );
    expect(
      document.querySelector('[role="tabpanel"]:not([hidden])')?.textContent
    ).toContain('安全内容');

    (
      document.querySelector('[aria-label="展开面包屑"]') as HTMLButtonElement
    ).click();
    expect(document.querySelectorAll('.one-breadcrumb__item')).toHaveLength(5);
    (
      document.querySelector('.one-breadcrumb__link') as HTMLAnchorElement
    ).click();
    expect(
      document.querySelector('[data-one-breadcrumb-result]')?.textContent
    ).toBe('点击：首页');

    (
      document.querySelector('[aria-label="下一页"]') as HTMLButtonElement
    ).click();
    expect(
      document.querySelector('[data-one-pagination-result]')?.textContent
    ).toBe('第 2 页，每页 10 条');
    const pageSize = document.querySelector(
      '[aria-label="每页条数"]'
    ) as HTMLSelectElement;
    pageSize.value = '20';
    pageSize.dispatchEvent(new Event('change', { bubbles: true }));
    const jumper = document.querySelector(
      '[aria-label="快速跳转页码"]'
    ) as HTMLInputElement;
    jumper.value = '99';
    jumper.dispatchEvent(new Event('input', { bubbles: true }));
    jumper.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    );
    expect(
      document.querySelector('[data-one-pagination-result]')?.textContent
    ).toBe('第 5 页，每页 20 条');
  });

  it('is safe when a docs page has no demo roots', () => {
    expect(() => mountOneDocsClient()).not.toThrow();
  });
});
