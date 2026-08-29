import { Component, type VNode } from '@geektech/tsone';
import { OneSwitch } from '../../../lib';

export class SwitchDemo extends Component<Record<string, never>> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      component: OneSwitch,
      props: {
        defaultChecked: false,
        ariaLabel: '切换通知',
      },
    };
  }
}
