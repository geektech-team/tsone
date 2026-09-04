import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneDescriptions } from '../lib';

describe('OneDescriptions', () => {
  let container: HTMLElement;
  let component: OneDescriptions | undefined;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    component = undefined;
    container.remove();
  });

  it('renders a title and one labelled value pair per item', () => {
    component = new OneDescriptions({
      title: '订单信息',
      items: [
        { label: '订单号', value: 'A-1024' },
        { label: '状态', value: '已发货' },
      ],
    });
    component.mount(container);

    expect(container.querySelector('.one-descriptions__title')?.textContent).toBe(
      '订单信息'
    );
    expect(container.querySelectorAll('.one-descriptions__item').length).toBe(2);
    expect(container.querySelector('.one-descriptions__label')?.textContent).toBe(
      '订单号'
    );
    expect(container.querySelector('.one-descriptions__value')?.textContent).toBe(
      'A-1024'
    );
  });

  it('applies the column count as a CSS custom property', () => {
    component = new OneDescriptions({ column: 2, items: [] });
    component.mount(container);

    const root = container.querySelector('.one-descriptions') as HTMLElement;
    expect(root.style.getPropertyValue('--one-descriptions-column')).toBe('2');
  });

  it('adds the bordered modifier and applies span on an item', () => {
    component = new OneDescriptions({
      bordered: true,
      items: [
        { label: 'a', value: '1' },
        { label: 'b', value: '2', span: 2 },
      ],
    });
    component.mount(container);

    expect(
      (container.querySelector('.one-descriptions') as HTMLElement).className
    ).toContain('one-descriptions--bordered');
    const items = container.querySelectorAll('.one-descriptions__item');
    expect((items[1] as HTMLElement).style.gridColumn).toBe('span 2');
  });
});
