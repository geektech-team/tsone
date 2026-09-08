import { Component } from '@geektech/tsone';
import { oneI18n } from './OneI18n';
import type { OneI18nParams } from './messages';

/**
 * 提供受保护 t() 的本地化组件基类。
 * 首次调用 t() 时把组件注册为语言切换订阅者，
 * locale 变化后会自动重渲染；卸载后由 OneI18n 清理。
 */
export abstract class OneLocalizedComponent<
  TProps extends object = object,
  TState extends object = object,
> extends Component<TProps, TState> {
  protected t(key: string, params?: OneI18nParams): string {
    oneI18n.attach(this);
    return oneI18n.t(key, params);
  }
}
