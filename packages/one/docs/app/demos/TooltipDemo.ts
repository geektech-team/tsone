import { Component, type VNode } from '@geektech/tsone';
import {
  OneButton,
  type OneFieldValueEvent,
  type OneOverlayPlacement,
  OneSelect,
  OneTooltip,
} from '../../../lib';
import { pick } from './locale';

interface TooltipDemoState {
  placement: OneOverlayPlacement;
  manualOpen: boolean;
}

const placements: OneOverlayPlacement[] = [
  'top-start',
  'top',
  'top-end',
  'right-start',
  'right',
  'right-end',
  'bottom-start',
  'bottom',
  'bottom-end',
  'left-start',
  'left',
  'left-end',
];

const placementOptions = placements.map((placement) => ({
  value: placement,
  label: placement,
}));

export class TooltipDemo extends Component<
  Record<string, never>,
  TooltipDemoState
> {
  private readonly handlePlacementChange = (payload: unknown): void => {
    const event = payload as OneFieldValueEvent<string>;
    this.setState({ placement: event.value as OneOverlayPlacement });
  };
  private readonly toggleManual = (): void => {
    this.setState({ manualOpen: !this.state.manualOpen });
  };

  protected initState(): TooltipDemoState {
    return { placement: 'top', manualOpen: false };
  }

  protected initStyles(): void {}

  protected onMounted(): void {
    const element = this.getElement();
    if (!(element instanceof HTMLElement)) {
      return;
    }
    const trigger = element.querySelector<HTMLElement>(
      '.one-docs-tooltip-edge .one-button'
    );
    if (trigger) {
      trigger.getBoundingClientRect = () => ({
        x: 190,
        y: 2,
        top: 2,
        left: 190,
        right: 230,
        bottom: 22,
        width: 40,
        height: 20,
        toJSON: () => ({}),
      });
    }
  }

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-tooltip-demo' },
      children: [
        {
          component: OneSelect,
          props: {
            options: placementOptions,
            value: this.state.placement,
            ariaLabel: pick('首选位置', 'Preferred placement'),
          },
          emitters: { change: this.handlePlacementChange },
        },
        {
          tag: 'div',
          props: { className: 'one-docs-tooltip-edge' },
          children: [
            {
              component: OneTooltip,
              props: {
                content: pick(
                  '靠近边缘时自动翻转',
                  'Flips automatically near edges'
                ),
                placement: this.state.placement,
                trigger: 'click',
              },
              children: [
                {
                  component: OneButton,
                  children: [pick('点击提示', 'Click hint')],
                },
              ],
            },
          ],
        },
        {
          component: OneButton,
          props: { variant: 'secondary' },
          children: [
            this.state.manualOpen
              ? pick('关闭手动提示', 'Close manual tooltip')
              : pick('打开手动提示', 'Open manual tooltip'),
          ],
          emitters: { click: this.toggleManual },
        },
        {
          component: OneTooltip,
          props: {
            content: pick('由 open 属性控制', 'Controlled by the open prop'),
            placement: 'right',
            trigger: 'manual',
            open: this.state.manualOpen,
          },
          children: [
            {
              component: OneButton,
              props: { variant: 'secondary' },
              children: [pick('手动模式触发器', 'Manual mode trigger')],
            },
          ],
        },
        {
          tag: 'output',
          props: { 'data-one-tooltip-result': '' },
          children: [
            pick(
              `请求位置：${this.state.placement}`,
              `Requested placement: ${this.state.placement}`
            ),
          ],
        },
      ],
    };
  }
}
