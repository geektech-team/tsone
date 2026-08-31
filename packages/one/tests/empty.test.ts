import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { OneEmpty } from '../lib/empty';

describe('OneEmpty', () => {
  let container: HTMLElement;
  let component: OneEmpty;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component?.unmount();
    container.remove();
  });

  it('renders a decorative default image and default description', () => {
    component = new OneEmpty();
    component.mount(container);

    expect(
      container.querySelector('.one-empty__image')?.getAttribute('aria-hidden')
    ).toBe('true');
    expect(
      container.querySelector('.one-empty__description')?.textContent
    ).toBe('暂无数据');
    expect(container.querySelector('.one-empty__actions')).toBeNull();
  });

  it('prefers image, default and actions slots over fallback content', () => {
    component = new OneEmpty({
      description: '后备说明',
      children: [
        { tag: 'span', slot: 'image', children: ['自定义图片'] },
        { tag: 'strong', children: ['自定义说明'] },
        { tag: 'button', slot: 'actions', children: ['创建数据'] },
      ],
    });
    component.mount(container);

    expect(container.querySelector('.one-empty__image')?.textContent).toBe(
      '自定义图片'
    );
    expect(
      container.querySelector('.one-empty__description')?.textContent
    ).toBe('自定义说明');
    expect(container.querySelector('.one-empty__actions')?.textContent).toBe(
      '创建数据'
    );
    expect(container.textContent).not.toContain('后备说明');
  });
});
