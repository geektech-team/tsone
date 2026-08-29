import { describe, expect, it } from 'bun:test';
import { OneFormModel } from '../lib/form/model';

describe('OneFormModel', () => {
  it('validates required, length, pattern and custom synchronous rules', () => {
    const model = new OneFormModel(
      { name: '', tags: [], enabled: false },
      {
        name: [
          { required: true, message: '名称不能为空' },
          { minLength: 3, message: '至少 3 个字符' },
          { pattern: /^[a-z]+$/, message: '仅允许小写字母' },
        ],
        tags: [{ required: true, message: '至少选择一个标签' }],
        enabled: [{ required: true, message: '请启用开关' }],
        code: [
          {
            validator: (value, values) =>
              value === values.name ? undefined : '编码必须等于名称',
          },
        ],
      }
    );

    ['name', 'tags', 'enabled', 'code'].forEach((name) => {
      model.registerField(name, () => undefined);
    });
    model.setValue('code', 'wrong');

    expect(model.validate().errors).toEqual({
      name: ['名称不能为空', '至少 3 个字符', '仅允许小写字母'],
      tags: ['至少选择一个标签'],
      enabled: ['请启用开关'],
      code: ['编码必须等于名称'],
    });
  });

  it('restores initial values and notifies subscribers for model mutations', () => {
    const model = new OneFormModel({ name: 'initial' });
    model.registerField('name', () => undefined);
    let notifications = 0;
    const unsubscribe = model.subscribe(() => {
      notifications += 1;
    });

    model.setValue('name', 'changed');
    model.validate();
    model.reset();

    expect(model.getValues()).toEqual({ name: 'initial' });
    expect(notifications).toBe(3);

    unsubscribe();
    model.setValue('name', 'ignored');
    expect(notifications).toBe(3);
  });

  it('removes an unregistered field from values, validation and focus targets', () => {
    const model = new OneFormModel(
      { active: 'value', hidden: '' },
      { hidden: [{ required: true, message: 'hidden is required' }] }
    );
    let focused = false;
    model.registerField('active', () => {
      focused = true;
    });
    const unregister = model.registerField('hidden', () => {
      focused = true;
    });

    unregister();

    expect(model.getValues()).toEqual({ active: 'value' });
    expect(model.validate().errors).toEqual({});
    expect(model.focusFirstInvalidField()).toBe(false);
    expect(focused).toBe(false);
  });

  it('reports a stable error when a custom validator throws', () => {
    const model = new OneFormModel(
      { name: 'value' },
      {
        name: [
          {
            validator: () => {
              throw new Error('unexpected');
            },
          },
        ],
      }
    );
    model.registerField('name', () => undefined);

    expect(model.validate().errors).toEqual({ name: ['校验器执行失败'] });
  });
});
