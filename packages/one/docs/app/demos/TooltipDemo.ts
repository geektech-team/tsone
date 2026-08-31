import { Component, type VNode } from '@geektech/tsone';
import { OneTooltip, type OneOverlayPlacement } from '../../../lib';

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

export class TooltipDemo extends Component<
  Record<string, never>,
  TooltipDemoState
> {
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
      '[data-one-tooltip-trigger]'
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
          tag: 'label',
          children: [
            '首选位置 ',
            {
              tag: 'select',
              props: {
                value: this.state.placement,
                'data-one-tooltip-placement': '',
              },
              children: placements.map((placement) => ({
                tag: 'option',
                props: { value: placement },
                children: [placement],
              })),
              listeners: {
                change: (event) => {
                  const select = event.currentTarget;
                  if (select instanceof HTMLSelectElement) {
                    this.state.placement = select.value as OneOverlayPlacement;
                  }
                },
              },
            },
          ],
        },
        {
          tag: 'div',
          props: { className: 'one-docs-tooltip-edge' },
          children: [
            {
              component: OneTooltip,
              props: {
                content: '靠近边缘时自动翻转',
                placement: this.state.placement,
                trigger: 'click',
              },
              children: [
                {
                  tag: 'button',
                  props: {
                    type: 'button',
                    'data-one-tooltip-trigger': '',
                  },
                  children: ['点击提示'],
                },
              ],
            },
          ],
        },
        {
          tag: 'button',
          props: { type: 'button', 'data-one-tooltip-manual': '' },
          children: [this.state.manualOpen ? '关闭手动提示' : '打开手动提示'],
          listeners: {
            click: () => {
              this.state.manualOpen = !this.state.manualOpen;
            },
          },
        },
        {
          component: OneTooltip,
          props: {
            content: '由 open 属性控制',
            placement: 'right',
            trigger: 'manual',
            open: this.state.manualOpen,
          },
          children: [
            {
              tag: 'button',
              props: { type: 'button' },
              children: ['手动模式触发器'],
            },
          ],
        },
        {
          tag: 'output',
          props: { 'data-one-tooltip-result': '' },
          children: [`请求位置：${this.state.placement}`],
        },
      ],
    };
  }
}
