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
    ].join('');

    mountOneDocsClient();

    expect(document.querySelector('.one-button')).toBeTruthy();
    expect(document.querySelector('.one-input')).toBeTruthy();
    expect(document.querySelector('.one-card')).toBeTruthy();
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

  it('is safe when a docs page has no demo roots', () => {
    expect(() => mountOneDocsClient()).not.toThrow();
  });
});
