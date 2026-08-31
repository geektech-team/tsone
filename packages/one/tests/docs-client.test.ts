import { beforeEach, describe, expect, it } from 'bun:test';
import { mountOneDocsClient } from '../docs/app/client';

describe('One UI docs client', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('mounts each real component demo into marked roots', () => {
    document.body.innerHTML = [
      '<div data-one-demo="button"></div>',
      '<div data-one-demo="input"></div>',
      '<div data-one-demo="card"></div>',
      '<div data-one-demo="form"></div>',
      '<div data-one-demo="select"></div>',
      '<div data-one-demo="checkbox"></div>',
      '<div data-one-demo="switch"></div>',
      '<div data-one-demo="alert"></div>',
      '<div data-one-demo="message"></div>',
      '<div data-one-demo="dialog"></div>',
      '<div data-one-demo="tooltip"></div>',
    ].join('');

    mountOneDocsClient();

    expect(document.querySelector('.one-button')).toBeTruthy();
    expect(document.querySelector('.one-input')).toBeTruthy();
    expect(document.querySelector('.one-card')).toBeTruthy();
    expect(document.querySelector('.one-form')).toBeTruthy();
    expect(document.querySelector('.one-select')).toBeTruthy();
    expect(document.querySelector('.one-checkbox-group')).toBeTruthy();
    expect(document.querySelector('.one-switch')).toBeTruthy();
    expect(document.querySelector('.one-alert')).toBeTruthy();
    expect(document.querySelector('[data-one-open-message]')).toBeTruthy();
    expect(document.querySelector('[data-one-open-dialog]')).toBeTruthy();
    expect(document.querySelector('[data-one-tooltip-trigger]')).toBeTruthy();
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

    (
      document.querySelector('[data-one-alert-action]') as HTMLButtonElement
    ).click();
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
    (
      document.querySelector('[data-one-open-message]') as HTMLButtonElement
    ).click();
    expect(document.body.querySelector('.one-message')?.textContent).toContain(
      '保存成功'
    );
    (
      document.querySelector('[data-one-update-message]') as HTMLButtonElement
    ).click();
    expect(document.body.querySelector('.one-message')?.textContent).toContain(
      '内容已更新'
    );
    (
      document.querySelector('[data-one-close-messages]') as HTMLButtonElement
    ).click();
    expect(document.body.querySelector('.one-message')).toBeNull();

    (
      document.querySelector('[data-one-open-dialog]') as HTMLButtonElement
    ).click();
    expect(document.body.querySelector('[role="dialog"]')).toBeTruthy();
    (
      document.querySelector('.one-dialog__cancel') as HTMLButtonElement
    ).click();
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();

    (
      document.querySelector('[data-one-confirm-dialog]') as HTMLButtonElement
    ).click();
    (
      document.querySelector('.one-dialog__confirm') as HTMLButtonElement
    ).click();
    await Promise.resolve();
    expect(
      document.querySelector('[data-one-dialog-result]')?.textContent
    ).toBe('确认结果：true');
  });

  it('demonstrates Tooltip placement, edge flip, click and manual modes', () => {
    document.body.innerHTML = '<div data-one-demo="tooltip"></div>';
    mountOneDocsClient();
    const trigger = document.querySelector(
      '[data-one-tooltip-trigger]'
    ) as HTMLButtonElement;

    trigger.click();
    const tooltip = document.querySelector('[role="tooltip"]') as HTMLElement;
    expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id);
    expect(tooltip.dataset.placement).toBe('bottom');

    (
      document.querySelector('[data-one-tooltip-manual]') as HTMLButtonElement
    ).click();
    expect(document.querySelectorAll('[role="tooltip"]')).toHaveLength(1);
    expect(document.querySelector('[role="tooltip"]')?.textContent).toContain(
      '由 open 属性控制'
    );
    expect(
      document.querySelector('[data-one-tooltip-result]')?.textContent
    ).toContain('请求位置：top');

    (
      document.querySelector('[data-one-tooltip-manual]') as HTMLButtonElement
    ).click();
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('is safe when a docs page has no demo roots', () => {
    expect(() => mountOneDocsClient()).not.toThrow();
  });
});
