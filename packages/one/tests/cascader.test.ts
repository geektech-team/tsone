import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import {
  OneCascader,
  type OneCascaderOption,
  type OneFieldValueEvent,
} from '../lib';

const options: readonly OneCascaderOption[] = [
  {
    value: 'zhejiang',
    label: '浙江',
    children: [
      {
        value: 'hangzhou',
        label: '杭州',
        children: [
          { value: 'xihu', label: '西湖区' },
          { value: 'yuhang', label: '余杭区' },
        ],
      },
      { value: 'ningbo', label: '宁波' },
    ],
  },
  {
    value: 'jiangsu',
    label: '江苏',
    children: [{ value: 'nanjing', label: '南京' }],
  },
];

function openPanel(container: HTMLElement): void {
  const trigger = container.querySelector(
    '[role="combobox"]'
  ) as HTMLElement;
  trigger.dispatchEvent(new Event('click'));
}

function optionByText(
  container: HTMLElement,
  text: string
): HTMLElement | undefined {
  return [...container.querySelectorAll('[role="option"]')].find(
    (option) => option.textContent?.startsWith(text)
  ) as HTMLElement | undefined;
}

describe('OneCascader', () => {
  let container: HTMLElement;
  let component: OneCascader;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('renders a placeholder and opens the top-level column', () => {
    component = new OneCascader({ options });
    component.mount(container);

    expect(container.textContent).toContain('请选择');
    openPanel(container);
    const columns = container.querySelectorAll('.one-cascader__column');
    expect(columns.length).toBe(1);
    expect(optionByText(container, '浙江')).toBeDefined();
    expect(optionByText(container, '江苏')).toBeDefined();
  });

  it('expands columns down the tree and commits a leaf path', () => {
    component = new OneCascader({ options });
    const changes: Array<OneFieldValueEvent<string[]>> = [];
    component.on('change', (payload) =>
      changes.push(payload as OneFieldValueEvent<string[]>)
    );
    component.mount(container);
    openPanel(container);

    optionByText(container, '浙江')?.dispatchEvent(new Event('click'));
    expect(container.querySelectorAll('.one-cascader__column').length).toBe(2);
    expect(optionByText(container, '杭州')).toBeDefined();
    expect(optionByText(container, '宁波')).toBeDefined();

    optionByText(container, '杭州')?.dispatchEvent(new Event('click'));
    expect(container.querySelectorAll('.one-cascader__column').length).toBe(3);

    optionByText(container, '西湖区')?.dispatchEvent(new Event('click'));
    expect(changes[0].value).toEqual(['zhejiang', 'hangzhou', 'xihu']);
    expect(container.querySelector('.one-cascader__panel')).toBeNull();
    expect(container.textContent).toContain('浙江 / 杭州 / 西湖区');
  });

  it('selects an intermediate leaf without further children', () => {
    component = new OneCascader({ options });
    const changes: Array<OneFieldValueEvent<string[]>> = [];
    component.on('change', (payload) =>
      changes.push(payload as OneFieldValueEvent<string[]>)
    );
    component.mount(container);
    openPanel(container);

    optionByText(container, '浙江')?.dispatchEvent(new Event('click'));
    optionByText(container, '宁波')?.dispatchEvent(new Event('click'));
    expect(changes[0].value).toEqual(['zhejiang', 'ningbo']);
    expect(container.querySelector('.one-cascader__panel')).toBeNull();
  });

  it('highlights the active path and expands to the controlled value', () => {
    component = new OneCascader({
      options,
      value: ['zhejiang', 'hangzhou'],
    });
    component.mount(container);
    expect(container.textContent).toContain('浙江 / 杭州');
    openPanel(container);
    expect(container.querySelectorAll('.one-cascader__column').length).toBe(3);
    expect(
      container
        .querySelector('[role="option"][aria-selected="true"]')
        ?.textContent?.startsWith('浙江')
    ).toBe(true);
  });

  it('keeps an uncontrolled value when clicking the same leaf again', () => {
    component = new OneCascader({ options, defaultValue: ['zhejiang'] });
    component.mount(container);
    openPanel(container);
    optionByText(container, '浙江')?.dispatchEvent(new Event('click'));
    optionByText(container, '杭州')?.dispatchEvent(new Event('click'));
    expect(container.querySelector('.one-cascader__panel')).not.toBeNull();
  });

  it('commits on any level when changeOnSelect is enabled', () => {
    component = new OneCascader({ options, changeOnSelect: true });
    const changes: Array<OneFieldValueEvent<string[]>> = [];
    component.on('change', (payload) =>
      changes.push(payload as OneFieldValueEvent<string[]>)
    );
    component.mount(container);
    openPanel(container);

    optionByText(container, '浙江')?.dispatchEvent(new Event('click'));
    expect(changes[0].value).toEqual(['zhejiang']);
    expect(container.querySelector('.one-cascader__panel')).not.toBeNull();
  });

  it('ignores disabled options and disables the trigger', () => {
    const withDisabled = [
      ...options,
      { value: 'blocked', label: '已锁定', disabled: true },
    ] as const;
    component = new OneCascader({ options: withDisabled, disabled: true });
    component.mount(container);

    const trigger = container.querySelector('[role="combobox"]') as HTMLButtonElement;
    expect(trigger.disabled).toBe(true);
    trigger.dispatchEvent(new Event('click'));
    expect(container.querySelector('.one-cascader__panel')).toBeNull();
  });

  it('closes the panel with Escape', () => {
    component = new OneCascader({ options });
    component.mount(container);
    openPanel(container);
    expect(container.querySelector('.one-cascader__panel')).not.toBeNull();

    const trigger = container.querySelector(
      '[role="combobox"]'
    ) as HTMLElement;
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    );
    expect(container.querySelector('.one-cascader__panel')).toBeNull();
  });

  it('emits input and change with the same value payload', () => {
    component = new OneCascader({ options });
    const inputs: Array<OneFieldValueEvent<string[]>> = [];
    const changes: Array<OneFieldValueEvent<string[]>> = [];
    component.on('input', (payload) =>
      inputs.push(payload as OneFieldValueEvent<string[]>)
    );
    component.on('change', (payload) =>
      changes.push(payload as OneFieldValueEvent<string[]>)
    );
    component.mount(container);
    openPanel(container);
    optionByText(container, '江苏')?.dispatchEvent(new Event('click'));
    optionByText(container, '南京')?.dispatchEvent(new Event('click'));

    expect(inputs[0].value).toEqual(['jiangsu', 'nanjing']);
    expect(changes[0].value).toEqual(['jiangsu', 'nanjing']);
  });
  it('positions the panel as a fixed floating layer and closes on outside click', () => {
    component = new OneCascader({ options });
    component.mount(container);
    openPanel(container);
    const panel = container.querySelector(
      '.one-cascader__panel'
    ) as HTMLElement;
    expect(panel.style.position).toBe('fixed');
    document.dispatchEvent(new Event('pointerdown'));
    expect(container.querySelector('.one-cascader__panel')).toBeNull();
  });
});
